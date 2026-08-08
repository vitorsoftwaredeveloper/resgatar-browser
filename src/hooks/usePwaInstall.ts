import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type PwaInstallMode = "prompt" | "manual-ios" | "manual-safari" | "unavailable";

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

function isIosDevice() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isSafariBrowser() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /safari/i.test(ua) && !/chrome|chromium|crios|edg|fxios|firefox|opr/i.test(ua);
}

function supportsInstallPromptApi() {
  return typeof window !== "undefined" && "onbeforeinstallprompt" in window;
}

function subscribeStandalone(callback: () => void) {
  const mql = window.matchMedia("(display-mode: standalone)");
  mql.addEventListener("change", callback);
  window.addEventListener("appinstalled", callback);
  return () => {
    mql.removeEventListener("change", callback);
    window.removeEventListener("appinstalled", callback);
  };
}

function subscribeNever() {
  return () => {};
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const isStandalone = useSyncExternalStore(subscribeStandalone, isStandaloneDisplay, () => false);
  const isIos = useSyncExternalStore(subscribeNever, isIosDevice, () => false);
  const isSafari = useSyncExternalStore(subscribeNever, isSafariBrowser, () => false);
  const hasPromptApi = useSyncExternalStore(subscribeNever, supportsInstallPromptApi, () => false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => setDeferredPrompt(null);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const installMode: PwaInstallMode = isStandalone
    ? "unavailable"
    : deferredPrompt
      ? "prompt"
      : hasPromptApi
        ? "unavailable"
        : isIos
          ? "manual-ios"
          : isSafari
            ? "manual-safari"
            : "unavailable";

  return {
    isStandalone,
    isIos,
    installMode,
    canInstall: installMode !== "unavailable",
    canPromptInstall: deferredPrompt !== null,
    promptInstall,
  };
}
