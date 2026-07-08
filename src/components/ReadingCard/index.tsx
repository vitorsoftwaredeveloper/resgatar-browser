"use client";

import { CoachTarget } from "@/components/CoachTarget";
import { useAppTheme } from "@/context/ThemeContext";
import { ChevronDown, Pause, Play } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import styles from "./ReadingCard.module.css";

// Portado de resgatar_app/src/components/ReadingCard. TTSState inlined (ver
// nota em PsalmCard) — o hook useLiturgyTTS ainda não foi portado para web.

type TTSState = "idle" | "loading" | "playing" | "paused";

interface Props {
  label: string;
  referencia: string;
  titulo?: string;
  texto: string;
  formulaFinal?: string;
  defaultExpanded?: boolean;
  testID?: string;
  ttsState?: TTSState;
  onTTSPlay?: () => void;
  onTTSPause?: () => void;
  coachId?: string;
  onExpand?: () => void;
}

function formatVerseText(text: string, textClass: string, verseClass: string) {
  const parts = text.split(/(\d+)(?=[A-Za-zÀ-ÿ])/);
  return parts.map((part, i) =>
    /^\d+$/.test(part) ? (
      <span key={i} className={verseClass}>
        {part}{" "}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

export function ReadingCard({
  label,
  referencia,
  titulo,
  texto,
  formulaFinal,
  defaultExpanded = false,
  ttsState,
  onTTSPlay,
  onTTSPause,
  coachId,
  onExpand,
}: Props) {
  const { colors } = useAppTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [texto, formulaFinal]);

  const ttsButton = onTTSPlay && (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        ttsState === "playing" ? onTTSPause?.() : onTTSPlay();
      }}
      className={[styles.ttsBtn, ttsState === "playing" && styles.ttsBtnActive]
        .filter(Boolean)
        .join(" ")}
      aria-label={ttsState === "playing" ? "Pausar leitura" : "Ouvir leitura"}
      aria-disabled={ttsState === "loading"}
    >
      {ttsState === "playing" ? (
        <Pause size={13} color={colors.primary} fill={colors.primary} />
      ) : (
        <Play size={13} color={colors.primary} fill={colors.primary} />
      )}
    </span>
  );

  return (
    <button
      type="button"
      className={styles.card}
      onClick={() =>
        setExpanded((v) => {
          if (!v) onExpand?.();
          return !v;
        })
      }
    >
      <div className={styles.cardHeader}>
        <span className={styles.label}>{label}</span>
        {coachId ? (
          <CoachTarget id={coachId}>{ttsButton}</CoachTarget>
        ) : (
          ttsButton
        )}
      </div>

      {!!referencia && <p className={styles.referencia}>{referencia}</p>}
      {!!titulo && <p className={styles.titulo}>{titulo}</p>}

      <div className={styles.toggleRow}>
        <span className={styles.toggleText}>
          {expanded ? "Ocultar" : "Ver mais"}
        </span>
        <span
          className={[styles.arrow, expanded && styles.arrowExpanded]
            .filter(Boolean)
            .join(" ")}
        >
          <ChevronDown size={16} color={colors.primary} />
        </span>
      </div>

      <div
        className={styles.expandable}
        style={{ height: expanded ? contentHeight : 0 }}
      >
        <div ref={contentRef}>
          <p className={styles.texto}>
            {formatVerseText(texto, styles.texto, styles.verseNumber)}
          </p>
          {!!formulaFinal && (
            <p className={styles.formulaFinal}>{`— ${formulaFinal}`}</p>
          )}
        </div>
      </div>
    </button>
  );
}
