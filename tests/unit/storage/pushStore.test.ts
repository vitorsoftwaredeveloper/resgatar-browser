import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearPushToken,
  getPushTokenServerSnapshot,
  getPushTokenSnapshot,
  isPushDisabledByUser,
  savePushToken,
  setPushDisabledByUser,
  subscribeToPushToken,
} from "@/storage/pushStore";

beforeEach(() => {
  window.localStorage.clear();
  clearPushToken();
});

describe("token de push", () => {
  it("grava o token na memória e no localStorage", () => {
    savePushToken("tok-123");

    expect(getPushTokenSnapshot()).toBe("tok-123");
    expect(window.localStorage.getItem("@push:token")).toBe("tok-123");
  });

  it("limpa o token dos dois lugares", () => {
    savePushToken("tok-123");
    clearPushToken();

    expect(getPushTokenSnapshot()).toBeNull();
    expect(window.localStorage.getItem("@push:token")).toBeNull();
  });

  it("o snapshot do servidor é sempre null", () => {
    savePushToken("tok-123");

    expect(getPushTokenServerSnapshot()).toBeNull();
  });
});

describe("assinatura de mudanças", () => {
  it("avisa os inscritos ao gravar e ao limpar", () => {
    const listener = vi.fn();
    subscribeToPushToken(listener);

    savePushToken("tok-123");
    expect(listener).toHaveBeenCalledTimes(1);

    clearPushToken();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("para de avisar depois de cancelar a inscrição", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToPushToken(listener);

    unsubscribe();
    savePushToken("tok-123");

    expect(listener).not.toHaveBeenCalled();
  });

  it("avisa todos os inscritos", () => {
    const um = vi.fn();
    const dois = vi.fn();
    const cancelaUm = subscribeToPushToken(um);
    const cancelaDois = subscribeToPushToken(dois);

    savePushToken("tok-123");

    expect(um).toHaveBeenCalledTimes(1);
    expect(dois).toHaveBeenCalledTimes(1);

    cancelaUm();
    cancelaDois();
  });
});

describe("push desativado pelo usuário", () => {
  it("começa desligado", () => {
    expect(isPushDisabledByUser()).toBe(false);
  });

  it("liga e desliga a flag", () => {
    setPushDisabledByUser(true);
    expect(isPushDisabledByUser()).toBe(true);

    setPushDisabledByUser(false);
    expect(isPushDisabledByUser()).toBe(false);
    expect(window.localStorage.getItem("@push:disabled")).toBeNull();
  });
});
