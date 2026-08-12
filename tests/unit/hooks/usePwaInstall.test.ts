import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePwaInstall } from "@/hooks/usePwaInstall";

const UA = {
  iphoneSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1",
  macSafari:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15",
  chrome:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
};

function definirUserAgent(value: string) {
  Object.defineProperty(window.navigator, "userAgent", {
    value,
    configurable: true,
  });
}

function definirStandalone(standalone: boolean) {
  const matchMedia = vi.fn(
    (query: string) =>
      ({
        matches: query.includes("standalone") ? standalone : false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList,
  );

  Object.defineProperty(window, "matchMedia", {
    value: matchMedia,
    configurable: true,
    writable: true,
  });
}

function definirPromptApi(disponivel: boolean) {
  if (disponivel) {
    Object.defineProperty(window, "onbeforeinstallprompt", {
      value: null,
      configurable: true,
    });
  } else {
    Reflect.deleteProperty(window, "onbeforeinstallprompt");
  }
}

function eventoDeInstalacao() {
  const event = new Event("beforeinstallprompt") as Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: string }>;
  };
  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome: "accepted" });
  return event;
}

beforeEach(() => {
  definirStandalone(false);
  definirUserAgent(UA.chrome);
  definirPromptApi(false);
});

afterEach(() => {
  vi.restoreAllMocks();
  definirPromptApi(false);
});

describe("modo de instalação", () => {
  it("fica indisponível quando já está instalado como PWA", () => {
    definirStandalone(true);
    definirUserAgent(UA.iphoneSafari);

    const { result } = renderHook(() => usePwaInstall());

    expect(result.current.isStandalone).toBe(true);
    expect(result.current.installMode).toBe("unavailable");
    expect(result.current.canInstall).toBe(false);
  });

  it("instrui instalação manual no iOS", () => {
    definirUserAgent(UA.iphoneSafari);

    const { result } = renderHook(() => usePwaInstall());

    expect(result.current.isIos).toBe(true);
    expect(result.current.installMode).toBe("manual-ios");
    expect(result.current.canInstall).toBe(true);
  });

  it("instrui instalação manual no Safari de desktop", () => {
    definirUserAgent(UA.macSafari);

    const { result } = renderHook(() => usePwaInstall());

    expect(result.current.isIos).toBe(false);
    expect(result.current.installMode).toBe("manual-safari");
  });

  it("fica indisponível no Chrome enquanto o evento não chega", () => {
    definirPromptApi(true);

    const { result } = renderHook(() => usePwaInstall());

    expect(result.current.installMode).toBe("unavailable");
    expect(result.current.canPromptInstall).toBe(false);
  });

  it("fica indisponível em navegador sem suporte nenhum", () => {
    definirUserAgent("curl/8.4.0");

    const { result } = renderHook(() => usePwaInstall());

    expect(result.current.installMode).toBe("unavailable");
  });
});

describe("evento beforeinstallprompt", () => {
  it("passa para o modo prompt quando o evento chega", () => {
    definirPromptApi(true);
    const { result } = renderHook(() => usePwaInstall());

    act(() => {
      window.dispatchEvent(eventoDeInstalacao());
    });

    expect(result.current.installMode).toBe("prompt");
    expect(result.current.canPromptInstall).toBe(true);
  });

  it("impede o banner nativo do navegador", () => {
    const event = eventoDeInstalacao();
    const preventDefault = vi.spyOn(event, "preventDefault");
    renderHook(() => usePwaInstall());

    act(() => {
      window.dispatchEvent(event);
    });

    expect(preventDefault).toHaveBeenCalled();
  });

  it("dispara o prompt e limpa o evento depois da escolha", async () => {
    const event = eventoDeInstalacao();
    const { result } = renderHook(() => usePwaInstall());

    act(() => {
      window.dispatchEvent(event);
    });

    await act(async () => {
      await result.current.promptInstall();
    });

    expect(event.prompt).toHaveBeenCalled();
    expect(result.current.canPromptInstall).toBe(false);
  });

  it("promptInstall não faz nada sem evento guardado", async () => {
    const { result } = renderHook(() => usePwaInstall());

    await act(async () => {
      await result.current.promptInstall();
    });

    expect(result.current.canPromptInstall).toBe(false);
  });

  it("descarta o evento quando o app é instalado", () => {
    const { result } = renderHook(() => usePwaInstall());

    act(() => {
      window.dispatchEvent(eventoDeInstalacao());
    });
    expect(result.current.canPromptInstall).toBe(true);

    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });
    expect(result.current.canPromptInstall).toBe(false);
  });

  it("para de escutar ao desmontar", () => {
    const remover = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => usePwaInstall());

    unmount();

    expect(remover).toHaveBeenCalledWith(
      "beforeinstallprompt",
      expect.any(Function),
    );
    expect(remover).toHaveBeenCalledWith("appinstalled", expect.any(Function));
  });
});
