"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { IS_PUSH_CONFIGURED } from "@/config/env";
import {
  deleteFcmToken,
  getFcmToken,
  onForegroundMessage,
  registerMessagingServiceWorker,
} from "@/lib/firebaseMessaging";
import { DeviceServices } from "@/services/DeviceService";
import { ToastMessage } from "@/components/Toast";
import {
  clearPushToken,
  getPushTokenServerSnapshot,
  getPushTokenSnapshot,
  isPushDisabledByUser,
  savePushToken,
  setPushDisabledByUser,
  subscribeToPushToken,
} from "@/storage/pushStore";
import {
  detectPlatform,
  isPushBlockedInThisTab,
  isStandalonePwa,
  reEnableNotificationsInstruction,
} from "@/utils/device";
import { useAuth } from "./AuthContext";

export type PushPermission = "default" | "granted" | "denied" | "unsupported";

interface NotificationsContextData {
  permission: PushPermission;
  active: boolean;
  requesting: boolean;
  disabling: boolean;
  requestPermission: () => Promise<void>;
  disableNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextData>(
  {} as NotificationsContextData,
);

function getPermissionSnapshot(): PushPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  if (!IS_PUSH_CONFIGURED) return "unsupported";
  return Notification.permission as PushPermission;
}

function getPermissionServerSnapshot(): PushPermission {
  return "default";
}

function subscribeToPermissionChange(callback: () => void) {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) {
    return () => {};
  }

  let status: PermissionStatus | null = null;
  let cancelled = false;

  navigator.permissions
    .query({ name: "notifications" as PermissionName })
    .then((result) => {
      if (cancelled) return;
      status = result;
      status.addEventListener("change", callback);
    })
    .catch(() => {});

  return () => {
    cancelled = true;
    status?.removeEventListener("change", callback);
  };
}

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  const permission = useSyncExternalStore(
    subscribeToPermissionChange,
    getPermissionSnapshot,
    getPermissionServerSnapshot,
  );
  const storedToken = useSyncExternalStore(
    subscribeToPushToken,
    getPushTokenSnapshot,
    getPushTokenServerSnapshot,
  );

  const [requesting, setRequesting] = useState(false);
  const [disabling, setDisabling] = useState(false);

  const active = permission === "granted" && !!storedToken;
  const wasLoggedIn = useRef(false);

  const registerToken = useCallback(async (token: string) => {
    await DeviceServices.register(token, detectPlatform(), isStandalonePwa());
    savePushToken(token);
  }, []);

  useEffect(() => {
    registerMessagingServiceWorker().catch((error) =>
      console.error("Falha ao registrar service worker", error),
    );
  }, []);

  useEffect(() => {
    if (!isPushBlockedInThisTab()) return;

    const token = getPushTokenSnapshot();
    if (!token) return;

    DeviceServices.remove(token).catch(() => {});
    clearPushToken();
  }, []);

  useEffect(() => {
    if (isLoggedIn && !wasLoggedIn.current && permission === "granted") {
      if (!isPushBlockedInThisTab() && !isPushDisabledByUser()) {
        getFcmToken()
          .then((token) => (token ? registerToken(token) : undefined))
          .catch((error) =>
            console.error("Falha ao sincronizar token de notificação", error),
          );
      }
    }

    if (!isLoggedIn && wasLoggedIn.current) {
      const token = getPushTokenSnapshot();
      if (token) {
        DeviceServices.remove(token).catch(() => {});
        clearPushToken();
      }
    }

    wasLoggedIn.current = isLoggedIn;
  }, [isLoggedIn, permission, registerToken]);

  useEffect(() => {
    if (!IS_PUSH_CONFIGURED) return;

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    onForegroundMessage((payload) => {
      const title =
        payload.data?.title ?? payload.notification?.title ?? "Resgatar";
      const body = payload.data?.body ?? payload.notification?.body ?? "";

      ToastMessage.notification(title, body, payload.data?.url);
    }).then((unsub) => {
      if (cancelled) unsub();
      else unsubscribe = unsub;
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "notification-click" && event.data?.url) {
        router.push(event.data.url);
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () =>
      navigator.serviceWorker.removeEventListener("message", handleMessage);
  }, [router]);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (isPushBlockedInThisTab()) {
      ToastMessage.warning(
        "Instale o app para receber avisos",
        "No iPhone as notificações só funcionam pelo app instalado. Toque em Compartilhar e depois em Adicionar à Tela de Início.",
      );
      return;
    }

    setRequesting(true);
    setPushDisabledByUser(false);

    try {
      const result = await Notification.requestPermission();

      if (result === "denied") {
        ToastMessage.warning(
          "Notificações bloqueadas",
          `Para reativar, ${reEnableNotificationsInstruction()}`,
        );
        return;
      }
      if (result !== "granted") return;

      const token = await getFcmToken();
      if (!token) {
        ToastMessage.error(
          "Não foi possível ativar",
          "O navegador não retornou um token de notificação.",
        );
        return;
      }

      await registerToken(token);

      ToastMessage.success(
        "Notificações ativadas",
        "Você vai receber avisos da comunidade neste aparelho.",
      );
    } catch (error) {
      console.error("Erro ao ativar notificações", error);
      ToastMessage.error(
        "Não foi possível ativar",
        "Tente novamente em instantes.",
      );
    } finally {
      setRequesting(false);
    }
  }, [registerToken]);

  const disableNotifications = useCallback(async () => {
    setDisabling(true);

    try {
      const token = getPushTokenSnapshot() ?? (await getFcmToken());

      if (token) {
        await DeviceServices.remove(token).catch((error) =>
          console.error("Erro ao remover token no servidor", error),
        );
      }

      await deleteFcmToken().catch(() => {});
      clearPushToken();
      setPushDisabledByUser(true);

      ToastMessage.success(
        "Notificações desativadas",
        "Você não vai mais receber avisos neste aparelho.",
      );
    } catch (error) {
      console.error("Erro ao desativar notificações", error);
      ToastMessage.error(
        "Não foi possível desativar",
        "Tente novamente em instantes.",
      );
    } finally {
      setDisabling(false);
    }
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        permission,
        active,
        requesting,
        disabling,
        requestPermission,
        disableNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
