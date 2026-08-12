import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));

vi.mock("@/components/Toast", () => ({
  ToastMessage: { error: toastError, success: vi.fn(), warning: vi.fn() },
}));

import { useCepLookup } from "@/hooks/useCepLookup";

const RESPOSTA_OK = {
  logradouro: "Praça da Sé",
  localidade: "São Paulo",
  uf: "SP",
};

function mockFetch(body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({ json: async () => body });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  toastError.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useCepLookup", () => {
  it("começa sem carregar", () => {
    const { result } = renderHook(() => useCepLookup());

    expect(result.current.loading).toBe(false);
  });

  it("nem consulta quando o CEP não tem 8 dígitos", async () => {
    const fetchMock = mockFetch(RESPOSTA_OK);
    const { result } = renderHook(() => useCepLookup());

    let retorno: unknown = "inicial";
    await act(async () => {
      retorno = await result.current.fetchCep("0100");
    });

    expect(retorno).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("aceita CEP mascarado e monta a URL só com dígitos", async () => {
    const fetchMock = mockFetch(RESPOSTA_OK);
    const { result } = renderHook(() => useCepLookup());

    await act(async () => {
      await result.current.fetchCep("01001-000");
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://viacep.com.br/ws/01001000/json/",
    );
  });

  it("devolve logradouro, cidade e estado", async () => {
    mockFetch(RESPOSTA_OK);
    const { result } = renderHook(() => useCepLookup());

    let retorno: unknown;
    await act(async () => {
      retorno = await result.current.fetchCep("01001000");
    });

    expect(retorno).toEqual({
      street: "Praça da Sé",
      city: "São Paulo",
      state: "SP",
    });
  });

  it("preenche com vazio os campos que a API omite", async () => {
    mockFetch({});
    const { result } = renderHook(() => useCepLookup());

    let retorno: unknown;
    await act(async () => {
      retorno = await result.current.fetchCep("01001000");
    });

    expect(retorno).toEqual({ street: "", city: "", state: "" });
  });

  it("avisa quando a API responde erro de CEP", async () => {
    mockFetch({ erro: true });
    const { result } = renderHook(() => useCepLookup());

    let retorno: unknown = "inicial";
    await act(async () => {
      retorno = await result.current.fetchCep("99999999");
    });

    expect(retorno).toBeNull();
    expect(toastError).toHaveBeenCalledWith(
      "CEP não encontrado",
      "Verifique o CEP informado.",
    );
  });

  it("avisa quando a requisição falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const { result } = renderHook(() => useCepLookup());

    let retorno: unknown = "inicial";
    await act(async () => {
      retorno = await result.current.fetchCep("01001000");
    });

    expect(retorno).toBeNull();
    expect(toastError).toHaveBeenCalledWith(
      "Erro",
      "Não foi possível consultar o CEP.",
    );
  });

  it("volta a loading falso mesmo quando falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const { result } = renderHook(() => useCepLookup());

    await act(async () => {
      await result.current.fetchCep("01001000");
    });

    expect(result.current.loading).toBe(false);
  });
});
