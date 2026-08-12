import { afterEach, describe, expect, it, vi } from "vitest";
import {
  detectBrowser,
  detectPlatform,
  isIOS,
  isInAppWebview,
  isPushBlockedInThisTab,
  isStandalonePwa,
  reEnableNotificationsInstruction,
} from "@/utils/device";

const UA = {
  iphoneSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  ipad: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  androidChrome:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  windowsPhone:
    "Mozilla/5.0 (Windows Phone 10.0; Android 6.0.1; iPhone) AppleWebKit/537.36 Mobile Safari/537.36",
  mobileGenerico:
    "Mozilla/5.0 (Mobile; rv:120.0) Gecko/120.0 Firefox/120.0 Mobi",
  desktopChrome:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  desktopFirefox:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0",
  desktopSafari:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  edge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
  crios:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1",
  instagram:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 300.0.0.0",
  facebook:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 [FBAN/FBIOS;FBAV/440.0.0.0]",
  whatsapp:
    "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36 WhatsApp/2.24",
  wechat:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 MicroMessenger/8.0.0",
  robo: "curl/8.4.0",
};

describe("detectPlatform", () => {
  it("reconhece iOS", () => {
    expect(detectPlatform(UA.iphoneSafari)).toBe("ios");
    expect(detectPlatform(UA.ipad)).toBe("ios");
  });

  it("reconhece Android", () => {
    expect(detectPlatform(UA.androidChrome)).toBe("android");
  });

  it("classifica outros mobiles como web", () => {
    expect(detectPlatform(UA.mobileGenerico)).toBe("web");
  });

  it("classifica o resto como desktop", () => {
    expect(detectPlatform(UA.desktopChrome)).toBe("desktop");
    expect(detectPlatform(UA.robo)).toBe("desktop");
  });
});

describe("isIOS", () => {
  it("aceita iPhone e iPad", () => {
    expect(isIOS(UA.iphoneSafari)).toBe(true);
    expect(isIOS(UA.ipad)).toBe(true);
  });

  it("recusa Windows Phone que se declara iPhone", () => {
    expect(isIOS(UA.windowsPhone)).toBe(false);
  });

  it("recusa Android e desktop", () => {
    expect(isIOS(UA.androidChrome)).toBe(false);
    expect(isIOS(UA.desktopChrome)).toBe(false);
  });
});

describe("isInAppWebview", () => {
  it("reconhece os webviews de apps", () => {
    expect(isInAppWebview(UA.instagram)).toBe(true);
    expect(isInAppWebview(UA.facebook)).toBe(true);
    expect(isInAppWebview(UA.whatsapp)).toBe(true);
    expect(isInAppWebview(UA.wechat)).toBe(true);
  });

  it("não confunde navegador comum com webview", () => {
    expect(isInAppWebview(UA.iphoneSafari)).toBe(false);
    expect(isInAppWebview(UA.desktopChrome)).toBe(false);
  });
});

describe("detectBrowser", () => {
  it("dá precedência ao Edge sobre Chrome", () => {
    expect(detectBrowser(UA.edge)).toBe("edge");
  });

  it("reconhece Firefox no desktop e no iOS", () => {
    expect(detectBrowser(UA.desktopFirefox)).toBe("firefox");
    expect(detectBrowser(UA.mobileGenerico)).toBe("firefox");
  });

  it("reconhece Chrome no desktop e no iOS", () => {
    expect(detectBrowser(UA.desktopChrome)).toBe("chrome");
    expect(detectBrowser(UA.crios)).toBe("chrome");
  });

  it("reconhece Safari só quando não é Chrome nem Edge", () => {
    expect(detectBrowser(UA.desktopSafari)).toBe("safari");
  });

  it("cai em other quando não identifica", () => {
    expect(detectBrowser(UA.robo)).toBe("other");
  });
});

describe("reEnableNotificationsInstruction", () => {
  it("instrui pelos Ajustes no iOS, seja qual for o navegador", () => {
    expect(reEnableNotificationsInstruction(UA.iphoneSafari)).toContain(
      "Ajustes do iPhone",
    );
    expect(reEnableNotificationsInstruction(UA.crios)).toContain(
      "Ajustes do iPhone",
    );
  });

  it("dá a instrução de cada navegador no desktop", () => {
    expect(reEnableNotificationsInstruction(UA.desktopSafari)).toContain(
      "Safari",
    );
    expect(reEnableNotificationsInstruction(UA.desktopFirefox)).toContain(
      "Mais informações",
    );
    expect(reEnableNotificationsInstruction(UA.edge)).toContain(
      "Permissões para este site",
    );
    expect(reEnableNotificationsInstruction(UA.desktopChrome)).toContain(
      "cadeado",
    );
  });

  it("dá uma instrução genérica para navegador desconhecido", () => {
    expect(reEnableNotificationsInstruction(UA.robo)).toBe(
      "abra as configurações do site no seu navegador e permita as notificações.",
    );
  });
});

function definirDisplayMode(standalone: boolean) {
  Object.defineProperty(window, "matchMedia", {
    value: vi.fn((query: string) => ({ matches: standalone && query.includes("standalone") })),
    configurable: true,
    writable: true,
  });
}

function definirNavigatorStandalone(value: boolean | undefined) {
  Object.defineProperty(window.navigator, "standalone", {
    value,
    configurable: true,
  });
}

function definirUserAgent(value: string) {
  Object.defineProperty(window.navigator, "userAgent", {
    value,
    configurable: true,
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("isStandalonePwa", () => {
  it("reconhece o display-mode standalone", () => {
    definirDisplayMode(true);
    definirNavigatorStandalone(undefined);

    expect(isStandalonePwa()).toBe(true);
  });

  it("reconhece o navigator.standalone do iOS", () => {
    definirDisplayMode(false);
    definirNavigatorStandalone(true);

    expect(isStandalonePwa()).toBe(true);
  });

  it("é falso quando roda na aba do navegador", () => {
    definirDisplayMode(false);
    definirNavigatorStandalone(false);

    expect(isStandalonePwa()).toBe(false);
  });
});

describe("isPushBlockedInThisTab", () => {
  it("bloqueia no iOS fora do PWA", () => {
    definirUserAgent(UA.iphoneSafari);
    definirDisplayMode(false);
    definirNavigatorStandalone(false);

    expect(isPushBlockedInThisTab()).toBe(true);
  });

  it("libera no iOS instalado como PWA", () => {
    definirUserAgent(UA.iphoneSafari);
    definirDisplayMode(true);
    definirNavigatorStandalone(undefined);

    expect(isPushBlockedInThisTab()).toBe(false);
  });

  it("libera fora do iOS", () => {
    definirUserAgent(UA.androidChrome);
    definirDisplayMode(false);
    definirNavigatorStandalone(false);

    expect(isPushBlockedInThisTab()).toBe(false);
  });
});

describe("leitura implícita do user-agent", () => {
  it("usa o navigator quando nenhum argumento é passado", () => {
    definirUserAgent(UA.androidChrome);

    expect(detectPlatform()).toBe("android");
    expect(isIOS()).toBe(false);
    expect(detectBrowser()).toBe("chrome");
    expect(isInAppWebview()).toBe(false);
  });
});
