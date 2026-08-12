import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useBreakpoint, useMediaQuery } from "@/hooks/useBreakpoint";

interface MqlFalso {
  matches: boolean;
  media: string;
  listeners: Set<() => void>;
  addEventListener: (evento: string, callback: () => void) => void;
  removeEventListener: (evento: string, callback: () => void) => void;
}

let larguraAtual = 500;
let mqls: MqlFalso[] = [];

function larguraMinimaDe(query: string): number {
  const match = query.match(/min-width:\s*(\d+)px/);
  return match ? Number(match[1]) : 0;
}

function instalarMatchMedia() {
  const matchMedia = vi.fn((query: string) => {
    const mql: MqlFalso = {
      matches: larguraAtual >= larguraMinimaDe(query),
      media: query,
      listeners: new Set(),
      addEventListener: (_evento, callback) => mql.listeners.add(callback),
      removeEventListener: (_evento, callback) => mql.listeners.delete(callback),
    };
    mqls.push(mql);
    return mql as unknown as MediaQueryList;
  });

  Object.defineProperty(window, "matchMedia", {
    value: matchMedia,
    configurable: true,
    writable: true,
  });
}

function totalDeAssinantes(): number {
  return mqls.reduce((total, mql) => total + mql.listeners.size, 0);
}

function redimensionarPara(largura: number) {
  larguraAtual = largura;
  mqls.forEach((mql) => {
    mql.matches = larguraAtual >= larguraMinimaDe(mql.media);
    mql.listeners.forEach((callback) => callback());
  });
}

beforeEach(() => {
  larguraAtual = 500;
  mqls = [];
  instalarMatchMedia();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useMediaQuery", () => {
  it("devolve false quando a consulta não casa", () => {
    const { result } = renderHook(() => useMediaQuery("(min-width: 1024px)"));

    expect(result.current).toBe(false);
  });

  it("devolve true quando a consulta casa", () => {
    larguraAtual = 1440;

    const { result } = renderHook(() => useMediaQuery("(min-width: 1024px)"));

    expect(result.current).toBe(true);
  });

  it("reage à mudança de largura", () => {
    const { result } = renderHook(() => useMediaQuery("(min-width: 1024px)"));

    expect(result.current).toBe(false);

    act(() => {
      redimensionarPara(1440);
    });

    expect(result.current).toBe(true);
  });

  it("cancela a assinatura ao desmontar", () => {
    const { unmount } = renderHook(() => useMediaQuery("(min-width: 1024px)"));

    expect(totalDeAssinantes()).toBe(1);

    unmount();

    expect(totalDeAssinantes()).toBe(0);
  });
});

describe("useBreakpoint", () => {
  it("não é desktop abaixo de 1024px", () => {
    larguraAtual = 1023;

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.isDesktop).toBe(false);
  });

  it("é desktop a partir de 1024px", () => {
    larguraAtual = 1024;

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.isDesktop).toBe(true);
  });

  it("acompanha o redimensionamento da janela", () => {
    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.isDesktop).toBe(false);

    act(() => {
      redimensionarPara(1440);
    });
    expect(result.current.isDesktop).toBe(true);

    act(() => {
      redimensionarPara(375);
    });
    expect(result.current.isDesktop).toBe(false);
  });
});
