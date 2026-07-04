"use client";

import { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";

// Reorder por arraste via Pointer Events. O HTML5 native drag-and-drop
// (draggable + dragstart/dragover) é mouse-only na prática — não dispara de
// forma confiável em telas touch e ainda entra em conflito com o scroll do
// corpo do modal. Pointer Events funcionam uniformemente com mouse e touch.
// O item arrastado é identificado pela alça (grip); o índice de destino é
// calculado comparando a posição do ponteiro com o ponto médio de cada linha.

interface UseDragReorderOptions<T> {
  onReorder: (next: T[]) => void;
  onDrop: (next: T[]) => void;
}

export function useDragReorder<T>(items: T[], { onReorder, onDrop }: UseDragReorderOptions<T>) {
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const itemsRef = useRef(items);
  const dragIndex = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  function setRowRef(index: number) {
    return (node: HTMLDivElement | null) => {
      rowRefs.current[index] = node;
    };
  }

  function findTargetIndex(y: number): number {
    let target = itemsRef.current.length - 1;
    for (let i = 0; i < rowRefs.current.length; i++) {
      const rect = rowRefs.current[i]?.getBoundingClientRect();
      if (!rect) continue;
      if (y < rect.top + rect.height / 2) {
        target = i;
        break;
      }
    }
    return target;
  }

  function handlePointerDown(index: number) {
    return (e: ReactPointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      dragIndex.current = index;
      setDraggingIndex(index);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignora: alguns navegadores rejeitam capture fora de uma interação ativa.
      }
    };
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const from = dragIndex.current;
    if (from === null) return;

    const to = findTargetIndex(e.clientY);
    if (to === from) return;

    const next = [...itemsRef.current];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    dragIndex.current = to;
    setDraggingIndex(to);
    onReorder(next);
  }

  function handlePointerEnd() {
    if (dragIndex.current === null) return;
    dragIndex.current = null;
    setDraggingIndex(null);
    onDrop(itemsRef.current);
  }

  function dragHandleProps(index: number) {
    return {
      onPointerDown: handlePointerDown(index),
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerEnd,
      onPointerCancel: handlePointerEnd,
      onClick: (e: ReactMouseEvent<HTMLDivElement>) => e.stopPropagation(),
    };
  }

  return { draggingIndex, setRowRef, dragHandleProps };
}
