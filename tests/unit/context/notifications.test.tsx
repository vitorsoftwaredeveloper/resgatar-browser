import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const mocks = vi.hoisted(() => ({
  isLoggedIn: { current: false },
  push: vi.fn(),
  getFcmToken: vi.fn(),
  deleteFcmToken: vi.fn(),
  registerMessagingServiceWorker: vi.fn(),
  onForegroundMessage: vi.fn(),
  registrarDispositivo: vi.fn(),
  removerDispositivo: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastWarning: vi.fn(),
  toastNotification: vi.fn(),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ isLoggedIn: mocks.isLoggedIn.current }),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));

vi.mock("@/config/env", () => ({
  IS_PUSH_CONFIGURED: true,
  ENV: { FIREBASE_API_KEY: "k" },
}));

vi.mock("@/lib/firebaseMessaging", () => ({
  getFcmToken: mocks.getFcmToken,
  deleteFcmToken: mocks.deleteFcmToken,
  registerMessagingServiceWorker: mocks.registerMessagingServiceWorker,
  onForegroundMessage: mocks.onForegroundMessage,
}));

vi.mock("@/services/DeviceService", () => ({
  DeviceServices: {
    register: mocks.registrarDispositivo,
    remove: mocks.removerDispositivo,
  },
}));

vi.mock("@/components/Toast", () => ({
  ToastMessage: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
    warning: mocks.toastWarning,
    notification: mocks.toastNotification,
  },
}));

import {
  NotificationsProvider,
  useNotifications,
} from "@/context/NotificationsContext";
import { clearPushToken, getPushTokenSnapshot } from "@/storage/pushStore";

const UA_DESKTOP =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";
const UA_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1";

function definirUserAgent(value: string) {
  Object.defineProperty(window.navigator, "userAgent", {
    value,
    configurable: true,
  });
}

function definirPermissao(permission: string, requestResult = permission) {
  const NotificationFalso = {
    permission,
    requestPermission: vi.fn().mockResolvedValue(requestResult),
  };
  vi.stubGlobal("Notification", NotificationFalso);
  return NotificationFalso;
}

function envolver({ children }: { children: ReactNode }) {
  return <NotificationsProvider>{children}</NotificationsProvider>;
}

function montar() {
  return renderHook(() => useNotifications(), { wrapper: envolver });
}

beforeEach(() => {
  window.localStorage.clear();
  clearPushToken();
  Object.values(mocks).forEach((m) => {
    if (typeof m === "function") (m as ReturnType<typeof vi.fn>).mockReset();
  });
  mocks.isLoggedIn.current = false;
  mocks.getFcmToken.mockResolvedValue("token-fcm");
  mocks.deleteFcmToken.mockResolvedValue(undefined);
  mocks.registerMessagingServiceWorker.mockResolvedValue(undefined);
  mocks.onForegroundMessage.mockResolvedValue(() => {});
  mocks.registrarDispositivo.mockResolvedValue(undefined);
  mocks.removerDispositivo.mockResolvedValue(undefined);

  definirUserAgent(UA_DESKTOP);
  definirPermissao("default");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("estado inicial", () => {
  it("expõe a permissão atual do navegador", () => {
    definirPermissao("granted");

    const { result } = montar();

    expect(result.current.permission).toBe("granted");
  });

  it("não fica ativo sem token guardado", () => {
    definirPermissao("granted");

    const { result } = montar();

    expect(result.current.active).toBe(false);
  });

  it("registra o service worker de mensagens ao montar", () => {
    montar();

    expect(mocks.registerMessagingServiceWorker).toHaveBeenCalled();
  });

  it("assina as mensagens em primeiro plano", () => {
    montar();

    expect(mocks.onForegroundMessage).toHaveBeenCalled();
  });
});

describe("requestPermission", () => {
  it("ativa, registra o dispositivo e guarda o token", async () => {
    definirPermissao("default", "granted");
    const { result } = montar();

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(mocks.registrarDispositivo).toHaveBeenCalledWith(
      "token-fcm",
      "desktop",
      false,
    );
    expect(getPushTokenSnapshot()).toBe("token-fcm");
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "Notificações ativadas",
      "Você vai receber avisos da comunidade neste aparelho.",
    );
  });

  it("avisa quando o usuário bloqueia", async () => {
    definirPermissao("default", "denied");
    const { result } = montar();

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(mocks.toastWarning).toHaveBeenCalledWith(
      "Notificações bloqueadas",
      expect.stringContaining("Para reativar,"),
    );
    expect(mocks.registrarDispositivo).not.toHaveBeenCalled();
  });

  it("não faz nada quando o usuário só fecha o prompt", async () => {
    definirPermissao("default", "default");
    const { result } = montar();

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(mocks.registrarDispositivo).not.toHaveBeenCalled();
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
  });

  it("avisa quando o navegador não devolve token", async () => {
    definirPermissao("default", "granted");
    mocks.getFcmToken.mockResolvedValueOnce(null);
    const { result } = montar();

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(mocks.toastError).toHaveBeenCalledWith(
      "Não foi possível ativar",
      "O navegador não retornou um token de notificação.",
    );
  });

  it("avisa quando o registro do dispositivo falha", async () => {
    definirPermissao("default", "granted");
    mocks.registrarDispositivo.mockRejectedValueOnce(new Error("500"));
    const { result } = montar();

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(mocks.toastError).toHaveBeenCalledWith(
      "Não foi possível ativar",
      "Tente novamente em instantes.",
    );
  });

  it("no iPhone fora do PWA manda instalar o app", async () => {
    definirUserAgent(UA_IPHONE);
    const { result } = montar();

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(mocks.toastWarning).toHaveBeenCalledWith(
      "Instale o app para receber avisos",
      expect.stringContaining("Adicionar à Tela de Início"),
    );
    expect(mocks.registrarDispositivo).not.toHaveBeenCalled();
  });

  it("não faz nada em ambiente sem Notification", async () => {
    Reflect.deleteProperty(window, "Notification");
    const { result } = montar();

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(mocks.registrarDispositivo).not.toHaveBeenCalled();
  });
});

describe("disableNotifications", () => {
  it("remove o token do servidor, do Firebase e do storage", async () => {
    definirPermissao("granted", "granted");
    const { result } = montar();

    await act(async () => {
      await result.current.requestPermission();
    });
    expect(getPushTokenSnapshot()).toBe("token-fcm");

    await act(async () => {
      await result.current.disableNotifications();
    });

    expect(mocks.removerDispositivo).toHaveBeenCalledWith("token-fcm");
    expect(mocks.deleteFcmToken).toHaveBeenCalled();
    expect(getPushTokenSnapshot()).toBeNull();
    expect(window.localStorage.getItem("@push:disabled")).toBe("true");
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "Notificações desativadas",
      "Você não vai mais receber avisos neste aparelho.",
    );
  });

  it("busca o token no Firebase quando não há um guardado", async () => {
    const { result } = montar();

    await act(async () => {
      await result.current.disableNotifications();
    });

    expect(mocks.getFcmToken).toHaveBeenCalled();
    expect(mocks.removerDispositivo).toHaveBeenCalledWith("token-fcm");
  });

  it("segue desativando mesmo se o servidor recusar", async () => {
    mocks.removerDispositivo.mockRejectedValueOnce(new Error("500"));
    const { result } = montar();

    await act(async () => {
      await result.current.disableNotifications();
    });

    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "Notificações desativadas",
      expect.any(String),
    );
  });

  it("avisa quando falha antes de conseguir o token", async () => {
    mocks.getFcmToken.mockRejectedValueOnce(new Error("sem firebase"));
    const { result } = montar();

    await act(async () => {
      await result.current.disableNotifications();
    });

    expect(mocks.toastError).toHaveBeenCalledWith(
      "Não foi possível desativar",
      "Tente novamente em instantes.",
    );
  });
});

describe("reação ao login e logout", () => {
  it("sincroniza o token ao entrar com permissão concedida", async () => {
    definirPermissao("granted");
    mocks.isLoggedIn.current = true;

    montar();

    await waitFor(() => {
      expect(mocks.registrarDispositivo).toHaveBeenCalledWith(
        "token-fcm",
        "desktop",
        false,
      );
    });
  });

  it("não sincroniza quando o usuário desativou antes", async () => {
    definirPermissao("granted");
    window.localStorage.setItem("@push:disabled", "true");
    mocks.isLoggedIn.current = true;

    montar();

    await waitFor(() => {
      expect(mocks.registerMessagingServiceWorker).toHaveBeenCalled();
    });
    expect(mocks.registrarDispositivo).not.toHaveBeenCalled();
  });

  it("limpa o token ao sair", async () => {
    definirPermissao("granted");
    mocks.isLoggedIn.current = true;
    const { rerender } = montar();

    await waitFor(() => {
      expect(getPushTokenSnapshot()).toBe("token-fcm");
    });

    mocks.isLoggedIn.current = false;
    await act(async () => {
      rerender();
    });

    expect(mocks.removerDispositivo).toHaveBeenCalledWith("token-fcm");
    expect(getPushTokenSnapshot()).toBeNull();
  });
});

describe("mensagem em primeiro plano", () => {
  it("mostra o toast de notificação com os dados do payload", async () => {
    let entregar!: (payload: unknown) => void;
    mocks.onForegroundMessage.mockImplementation(
      (handler: (payload: unknown) => void) => {
        entregar = handler;
        return Promise.resolve(() => {});
      },
    );

    montar();
    await waitFor(() => expect(mocks.onForegroundMessage).toHaveBeenCalled());

    act(() => {
      entregar({
        data: { title: "Pagamento", body: "confirmado", url: "/bills" },
      });
    });

    expect(mocks.toastNotification).toHaveBeenCalledWith(
      "Pagamento",
      "confirmado",
      "/bills",
    );
  });

  it("cai para o payload de notification e para o título padrão", async () => {
    let entregar!: (payload: unknown) => void;
    mocks.onForegroundMessage.mockImplementation(
      (handler: (payload: unknown) => void) => {
        entregar = handler;
        return Promise.resolve(() => {});
      },
    );

    montar();
    await waitFor(() => expect(mocks.onForegroundMessage).toHaveBeenCalled());

    act(() => {
      entregar({ notification: { body: "corpo" } });
    });

    expect(mocks.toastNotification).toHaveBeenCalledWith(
      "Resgatar",
      "corpo",
      undefined,
    );
  });
});
