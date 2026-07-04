"use client";

import { useAppTheme } from "@/context/ThemeContext";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./SelectField.module.css";

// Portado de resgatar_app/src/components/SelectField. O Modal ancorado por
// measureInWindow vira um popover fixed posicionado via getBoundingClientRect,
// decidindo abrir para cima ou para baixo conforme o espaço disponível.

export interface SelectOption {
  label: string;
  value: string | number;
}

interface Props {
  label?: string;
  placeholder?: string;
  value: string | number | null;
  options: SelectOption[];
  onSelect: (value: string | number) => void;
  error?: string | false;
}

const LIST_MAX_HEIGHT = 240;
const GAP = 6;

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function SelectField({
  label,
  placeholder = "Selecionar",
  value,
  options,
  onSelect,
  error,
}: Props) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const selected = options.find((o) => o.value === value);

  const openList = () => {
    const node = anchorRef.current;
    if (!node) return;
    const r = node.getBoundingClientRect();
    setRect({ x: r.left, y: r.top, width: r.width, height: r.height });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const popover = useMemo(() => {
    if (!rect) return null;
    const windowH = typeof window !== "undefined" ? window.innerHeight : 0;
    const spaceBelow = windowH - (rect.y + rect.height) - GAP;
    const spaceAbove = rect.y - GAP;
    const dropUp = spaceBelow < LIST_MAX_HEIGHT && spaceAbove > spaceBelow;
    const available = dropUp ? spaceAbove : spaceBelow;
    const height = Math.min(LIST_MAX_HEIGHT, available);
    const top = dropUp ? rect.y - height - GAP : rect.y + rect.height + GAP;
    return { left: rect.x, width: rect.width, top, height };
  }, [rect]);

  return (
    <div className={styles.wrapper}>
      {label ? <label className={styles.label}>{label}</label> : null}

      <button
        ref={anchorRef}
        type="button"
        className={[styles.field, open && styles.fieldOpen, error && styles.fieldError]
          .filter(Boolean)
          .join(" ")}
        onClick={openList}
      >
        <span className={selected ? styles.value : styles.placeholder}>
          {selected ? selected.label : placeholder}
        </span>
        {open ? <ChevronUp size={18} color={colors.textMuted} /> : <ChevronDown size={18} color={colors.textMuted} />}
      </button>

      {error ? <p className={styles.errorText}>{error}</p> : null}

      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          {popover && (
            <div
              className={styles.list}
              style={{ left: popover.left, width: popover.width, top: popover.top, maxHeight: popover.height }}
              onClick={(e) => e.stopPropagation()}
            >
              {options.map((opt) => {
                const active = opt.value === value;
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    className={[styles.option, active && styles.optionActive].filter(Boolean).join(" ")}
                    onClick={() => {
                      onSelect(opt.value);
                      setOpen(false);
                    }}
                  >
                    <span className={[styles.optionText, active && styles.optionTextActive].filter(Boolean).join(" ")}>
                      {opt.label}
                    </span>
                    {active && <Check size={16} color={colors.primary} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
