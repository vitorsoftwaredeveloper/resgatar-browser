import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));

vi.mock("@/components/Toast", () => ({
  ToastMessage: { error: toastError, success: vi.fn(), warning: vi.fn() },
}));

import { useImagePicker } from "@/hooks/useImagePicker";

const TIPO_ACEITO = ["image", "*"].join("/");

type InputComCaptura = HTMLInputElement & { capture?: string };

let inputCriado: InputComCaptura | null = null;

function interceptarInput() {
  const original = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    const element = original(tag) as HTMLElement;
    if (tag === "input") {
      inputCriado = element as InputComCaptura;
      inputCriado.click = vi.fn();
    }
    return element;
  });
}

function arquivoDe(conteudo: string, nome = "foto.jpg") {
  return new File([conteudo], nome, { type: "image/jpeg" });
}

function entregarArquivo(file: File | null) {
  Object.defineProperty(inputCriado, "files", {
    value: file ? [file] : [],
    configurable: true,
  });
  inputCriado?.onchange?.(new Event("change"));
}

beforeEach(() => {
  inputCriado = null;
  toastError.mockReset();
  interceptarInput();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useImagePicker", () => {
  it("começa sem carregar", () => {
    const { result } = renderHook(() => useImagePicker());

    expect(result.current.loading).toBe(false);
  });

  it("monta um input de imagem e o aciona", async () => {
    const { result } = renderHook(() => useImagePicker());

    let promessa!: Promise<string | null>;
    act(() => {
      promessa = result.current.pickFromLibrary();
    });

    expect(inputCriado?.type).toBe("file");
    expect(inputCriado?.accept).toBe(TIPO_ACEITO);
    expect(inputCriado?.click).toHaveBeenCalled();

    await act(async () => {
      entregarArquivo(arquivoDe("conteudo"));
      await promessa;
    });
  });

  it("pede a câmera em takePhoto", () => {
    const { result } = renderHook(() => useImagePicker());

    act(() => {
      void result.current.takePhoto();
    });

    expect(inputCriado?.capture).toBe("environment");
  });

  it("não pede câmera em pickFromLibrary", () => {
    const { result } = renderHook(() => useImagePicker());

    act(() => {
      void result.current.pickFromLibrary();
    });

    expect(inputCriado?.capture).toBeUndefined();
  });

  it("devolve o base64 sem o prefixo data URI", async () => {
    const { result } = renderHook(() => useImagePicker());

    let promessa!: Promise<string | null>;
    act(() => {
      promessa = result.current.pickFromLibrary();
    });

    let base64: string | null = null;
    await act(async () => {
      entregarArquivo(arquivoDe("conteudo"));
      base64 = await promessa;
    });

    expect(base64).toBeTruthy();
    expect(base64).not.toContain("data:image");
    expect(toastError).not.toHaveBeenCalled();
  });

  it("devolve null quando o usuário cancela", async () => {
    const { result } = renderHook(() => useImagePicker());

    let promessa!: Promise<string | null>;
    act(() => {
      promessa = result.current.pickFromLibrary();
    });

    let resultado: string | null = "inicial";
    await act(async () => {
      inputCriado?.oncancel?.(new Event("cancel"));
      resultado = await promessa;
    });

    expect(resultado).toBeNull();
    expect(toastError).not.toHaveBeenCalled();
  });

  it("devolve null quando nenhum arquivo é escolhido", async () => {
    const { result } = renderHook(() => useImagePicker());

    let promessa!: Promise<string | null>;
    act(() => {
      promessa = result.current.pickFromLibrary();
    });

    let resultado: string | null = "inicial";
    await act(async () => {
      entregarArquivo(null);
      resultado = await promessa;
    });

    expect(resultado).toBeNull();
  });

  it("recusa imagem acima do limite e avisa", async () => {
    const { result } = renderHook(() => useImagePicker());

    let promessa!: Promise<string | null>;
    act(() => {
      promessa = result.current.pickFromLibrary();
    });

    let resultado: string | null = "inicial";
    await act(async () => {
      entregarArquivo(arquivoDe("x".repeat(600_000)));
      resultado = await promessa;
    });

    expect(resultado).toBeNull();
    expect(toastError).toHaveBeenCalledWith(
      "Imagem muito grande",
      "Escolha uma foto menor (até ~500 KB).",
    );
  });

  it("volta a loading falso depois de terminar", async () => {
    const { result } = renderHook(() => useImagePicker());

    let promessa!: Promise<string | null>;
    act(() => {
      promessa = result.current.pickFromLibrary();
    });

    await act(async () => {
      entregarArquivo(arquivoDe("conteudo"));
      await promessa;
    });

    expect(result.current.loading).toBe(false);
  });
});
