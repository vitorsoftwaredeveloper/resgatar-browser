export type Platform = "ios" | "android" | "web" | "desktop";

function safeUserAgent(): string {
  return typeof navigator === "undefined" ? "" : navigator.userAgent;
}

export function detectPlatform(userAgent: string = safeUserAgent()): Platform {
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/mobi/.test(ua)) return "web";
  return "desktop";
}

export function isIOS(userAgent: string = safeUserAgent()): boolean {
  return (
    /iphone|ipad|ipod/i.test(userAgent) && !/windows phone/i.test(userAgent)
  );
}

export function isInAppWebview(userAgent: string = safeUserAgent()): boolean {
  return /instagram|fban|fbav|whatsapp|line\/|micromessenger/i.test(userAgent);
}

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    nav.standalone === true
  );
}

export type Browser = "chrome" | "firefox" | "safari" | "edge" | "other";

export function detectBrowser(userAgent: string = safeUserAgent()): Browser {
  const ua = userAgent.toLowerCase();
  if (/edg\//.test(ua)) return "edge";
  if (/firefox|fxios/.test(ua)) return "firefox";
  if (/chrome|crios/.test(ua)) return "chrome";
  if (/safari/.test(ua)) return "safari";
  return "other";
}

export function reEnableNotificationsInstruction(
  userAgent: string = safeUserAgent(),
): string {
  if (isIOS(userAgent)) {
    return "abra os Ajustes do iPhone, procure este app na tela de início e libere as Notificações.";
  }

  switch (detectBrowser(userAgent)) {
    case "safari":
      return "abra o menu Safari > Configurações para Este Site > Notificações > Permitir.";
    case "firefox":
      return "clique no cadeado ao lado do endereço > Mais informações > Permissões > Notificações > Permitir.";
    case "edge":
      return "clique no cadeado ao lado do endereço > Permissões para este site > Notificações > Permitir.";
    case "chrome":
      return "toque no cadeado ao lado do endereço do site > Permissões > Notificações > Permitir.";
    default:
      return "abra as configurações do site no seu navegador e permita as notificações.";
  }
}

export function isPushBlockedInThisTab(): boolean {
  return isIOS() && !isStandalonePwa();
}
