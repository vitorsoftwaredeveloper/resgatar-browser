import { useCallback, useState, useSyncExternalStore } from "react";
import { deleteFcmToken, getFcmToken } from "@/config/firebase";
import { NotificationServices } from "@/services/NotificationService";
import { ToastMessage } from "@/components/Toast";
import {
  getPushSubscriptionServerSnapshot,
  getPushSubscriptionSnapshot,
  setPushSubscribed,
  subscribeToPushSubscriptionStore,
} from "./pushSubscriptionStore";

type PermissionState = NotificationPermission | "unsupported";

function getPermissionSnapshot(): PermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

function getServerPermissionSnapshot(): PermissionState {
  return "default";
}

function subscribePermissionChange(callback: () => void) {
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

export function useNotificationPermission() {
  const permission = useSyncExternalStore(
    subscribePermissionChange,
    getPermissionSnapshot,
    getServerPermissionSnapshot,
  );
  const subscribed = useSyncExternalStore(
    subscribeToPushSubscriptionStore,
    getPushSubscriptionSnapshot,
    getPushSubscriptionServerSnapshot,
  );
  const active = permission === "granted" && subscribed;

  const [requesting, setRequesting] = useState(false);
  const [disabling, setDisabling] = useState(false);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    setRequesting(true);
    try {
      const result = await Notification.requestPermission();

      if (result === "denied") {
        ToastMessage.warning(
          "Notificações bloqueadas",
          "Libere o acesso nas configurações do navegador para ativar.",
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

      await NotificationServices.registerFCMToken(token);
      setPushSubscribed(true);
      ToastMessage.success(
        "Notificações ativadas",
        "Você vai receber avisos da comunidade neste aparelho.",
      );
    } catch (error) {
      console.error("Erro ao ativar notificações", error);
      ToastMessage.error("Não foi possível ativar", "Tente novamente em instantes.");
    } finally {
      setRequesting(false);
    }
  }, []);

  const disableNotifications = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    setDisabling(true);
    try {
      const token = await getFcmToken();
      if (token) {
        await NotificationServices.removeFCMToken(token).catch((error) => {
          console.error("Erro ao remover token no servidor", error);
        });
      }
      await deleteFcmToken();
      setPushSubscribed(false);
      ToastMessage.success(
        "Notificações desativadas",
        "Você não vai mais receber avisos neste aparelho.",
      );
    } catch (error) {
      console.error("Erro ao desativar notificações", error);
      ToastMessage.error("Não foi possível desativar", "Tente novamente em instantes.");
    } finally {
      setDisabling(false);
    }
  }, []);

  return {
    permission,
    active,
    requesting,
    disabling,
    requestPermission,
    disableNotifications,
  };
}
