import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));

vi.mock("@/components/Toast", () => ({
  ToastMessage: { error: toastError, success: vi.fn(), warning: vi.fn() },
}));

import { useReceiptPicker, type ReceiptAsset } from "@/hooks/useReceiptPicker";

type InputComCaptura = HTMLInputElement & { capture?: string };

const CINCO_MB = 5 * 1024 * 1024;

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

function arquivoDe({
  tipo = "image/png",
  nome = "comprovante.png",
  tamanho = 1024,
} = {}) {
  const file = new File(["x"], nome, { type: tipo });
  Object.defineProperty(file, "size", { value: tamanho });
  return file;
}

function entregarArquivo(file: File | null) {
  Object.defineProperty(inputCriado, "files", {
    value: file ? [file] : [],
    configurable: true,
  });
  inputCriado?.onchange?.(new Event("change"));
}

async function escolher(
  hook: { current: ReturnType<typeof useReceiptPicker> },
  file: File | null,
): Promise<ReceiptAsset | null> {
  let promessa!: Promise<ReceiptAsset | null>;
  act(() => {
    promessa = hook.current.pickFromLibrary();
  });

  const capturado: { valor: ReceiptAsset | null } = { valor: null };
  await act(async () => {
    entregarArquivo(file);
    capturado.valor = await promessa;
  });

  return capturado.valor;
}

beforeEach(() => {
  inputCriado = null;
  toastError.mockReset();
  interceptarInput();
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn().mockReturnValue("blob:preview"),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useReceiptPicker", () => {
  it("começa sem carregar", () => {
    const { result } = renderHook(() => useReceiptPicker());

    expect(result.current.loading).toBe(false);
  });

  it("devolve arquivo, prévia, tipo e nome", async () => {
    const { result } = renderHook(() => useReceiptPicker());

    const asset = await escolher(result, arquivoDe());

    expect(asset).toEqual({
      file: expect.any(File),
      previewUrl: "blob:preview",
      contentType: "image/png",
      fileName: "comprovante.png",
    });
  });

  it("aceita os tipos de imagem permitidos", async () => {
    const { result } = renderHook(() => useReceiptPicker());

    for (const tipo of ["image/jpeg", "image/png", "image/webp"]) {
      const asset = await escolher(result, arquivoDe({ tipo }));
      expect(asset?.contentType).toBe(tipo);
    }
  });

  it("cai para jpeg quando o tipo não é permitido", async () => {
    const { result } = renderHook(() => useReceiptPicker());

    const asset = await escolher(
      result,
      arquivoDe({ tipo: "application/pdf", nome: "nota.pdf" }),
    );

    expect(asset?.contentType).toBe("image/jpeg");
  });

  it("usa nome padrão quando o arquivo não tem nome", async () => {
    const { result } = renderHook(() => useReceiptPicker());

    const asset = await escolher(result, arquivoDe({ nome: "" }));

    expect(asset?.fileName).toBe("comprovante");
  });

  it("recusa comprovante acima de 5 MB", async () => {
    const { result } = renderHook(() => useReceiptPicker());

    const asset = await escolher(result, arquivoDe({ tamanho: CINCO_MB + 1 }));

    expect(asset).toBeNull();
    expect(toastError).toHaveBeenCalledWith(
      "Arquivo muito grande",
      "Escolha um comprovante de até 5 MB.",
    );
  });

  it("aceita exatamente 5 MB", async () => {
    const { result } = renderHook(() => useReceiptPicker());

    const asset = await escolher(result, arquivoDe({ tamanho: CINCO_MB }));

    expect(asset).not.toBeNull();
    expect(toastError).not.toHaveBeenCalled();
  });

  it("devolve null quando o usuário cancela", async () => {
    const { result } = renderHook(() => useReceiptPicker());

    let promessa!: Promise<ReceiptAsset | null>;
    act(() => {
      promessa = result.current.pickFromLibrary();
    });

    const capturado: { valor: ReceiptAsset | null } = { valor: null };
    await act(async () => {
      inputCriado?.oncancel?.(new Event("cancel"));
      capturado.valor = await promessa;
    });

    expect(capturado.valor).toBeNull();
    expect(toastError).not.toHaveBeenCalled();
  });

  it("pede a câmera em takePhoto", () => {
    const { result } = renderHook(() => useReceiptPicker());

    act(() => {
      void result.current.takePhoto();
    });

    expect(inputCriado?.capture).toBe("environment");
  });

  it("volta a loading falso depois de terminar", async () => {
    const { result } = renderHook(() => useReceiptPicker());

    await escolher(result, arquivoDe());

    expect(result.current.loading).toBe(false);
  });
});
