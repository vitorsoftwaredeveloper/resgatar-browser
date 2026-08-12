import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDragReorder } from "@/hooks/useDragReorder";

const ITENS = ["a", "b", "c"];
const ALTURA = 40;

function linhaFalsa(indice: number) {
  return {
    getBoundingClientRect: () => ({
      top: indice * ALTURA,
      height: ALTURA,
    }),
  } as unknown as HTMLDivElement;
}

function montar(itens = ITENS) {
  const onReorder = vi.fn();
  const onDrop = vi.fn();
  const hook = renderHook(() => useDragReorder(itens, { onReorder, onDrop }));

  act(() => {
    itens.forEach((_, i) => hook.result.current.setRowRef(i)(linhaFalsa(i)));
  });

  return { hook, onReorder, onDrop };
}

function eventoPointer(clientY: number) {
  return {
    clientY,
    pointerId: 1,
    preventDefault: vi.fn(),
    currentTarget: { setPointerCapture: vi.fn() },
  } as never;
}

describe("useDragReorder", () => {
  it("começa sem item arrastado", () => {
    const { hook } = montar();

    expect(hook.result.current.draggingIndex).toBeNull();
  });

  it("marca o índice ao começar o arraste", () => {
    const { hook } = montar();

    act(() => {
      hook.result.current.dragHandleProps(1).onPointerDown(eventoPointer(50));
    });

    expect(hook.result.current.draggingIndex).toBe(1);
  });

  it("ignora movimento quando não há arraste ativo", () => {
    const { hook, onReorder } = montar();

    act(() => {
      hook.result.current.dragHandleProps(0).onPointerMove(eventoPointer(100));
    });

    expect(onReorder).not.toHaveBeenCalled();
  });

  it("reordena ao mover para outra posição", () => {
    const { hook, onReorder } = montar();

    act(() => {
      hook.result.current.dragHandleProps(0).onPointerDown(eventoPointer(10));
    });
    act(() => {
      hook.result.current.dragHandleProps(0).onPointerMove(eventoPointer(95));
    });

    expect(onReorder).toHaveBeenCalledWith(["b", "c", "a"]);
    expect(hook.result.current.draggingIndex).toBe(2);
  });

  it("não reordena quando o destino é a posição atual", () => {
    const { hook, onReorder } = montar();

    act(() => {
      hook.result.current.dragHandleProps(0).onPointerDown(eventoPointer(10));
    });
    act(() => {
      hook.result.current.dragHandleProps(0).onPointerMove(eventoPointer(5));
    });

    expect(onReorder).not.toHaveBeenCalled();
  });

  it("avisa o drop ao soltar e limpa o estado", () => {
    const { hook, onDrop } = montar();

    act(() => {
      hook.result.current.dragHandleProps(0).onPointerDown(eventoPointer(10));
    });
    act(() => {
      hook.result.current.dragHandleProps(0).onPointerUp();
    });

    expect(onDrop).toHaveBeenCalledWith(ITENS);
    expect(hook.result.current.draggingIndex).toBeNull();
  });

  it("ignora o drop quando nada estava sendo arrastado", () => {
    const { hook, onDrop } = montar();

    act(() => {
      hook.result.current.dragHandleProps(0).onPointerUp();
    });

    expect(onDrop).not.toHaveBeenCalled();
  });

  it("trata o cancelamento como fim do arraste", () => {
    const { hook, onDrop } = montar();

    act(() => {
      hook.result.current.dragHandleProps(1).onPointerDown(eventoPointer(50));
    });
    act(() => {
      hook.result.current.dragHandleProps(1).onPointerCancel();
    });

    expect(onDrop).toHaveBeenCalled();
    expect(hook.result.current.draggingIndex).toBeNull();
  });

  it("segura o clique na alça para não abrir o item", () => {
    const { hook } = montar();
    const stopPropagation = vi.fn();

    act(() => {
      hook.result.current
        .dragHandleProps(0)
        .onClick({ stopPropagation } as never);
    });

    expect(stopPropagation).toHaveBeenCalled();
  });

  it("sobrevive a linhas sem ref registrada", () => {
    const onReorder = vi.fn();
    const onDrop = vi.fn();
    const hook = renderHook(() =>
      useDragReorder(ITENS, { onReorder, onDrop }),
    );

    act(() => {
      hook.result.current.dragHandleProps(0).onPointerDown(eventoPointer(10));
    });
    act(() => {
      hook.result.current.dragHandleProps(0).onPointerMove(eventoPointer(999));
    });

    expect(onReorder).toHaveBeenCalledWith(["b", "c", "a"]);
  });
});
