"use client";

import { useAppTheme } from "@/context/ThemeContext";
import { ChevronDown, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./PsalmCard.module.css";

// Portado de resgatar_app/src/components/PsalmCard. A altura animada
// (reanimated + onLayout) vira medição via ref.scrollHeight + CSS transition
// no height. TTSState inlined aqui — o hook useLiturgyTTS (expo-av) ainda não
// foi portado para web; este componente só recebe estado/callbacks via props.

type TTSState = "idle" | "loading" | "playing" | "paused";

interface Props {
  referencia: string;
  refrao?: string;
  texto: string;
  testID?: string;
  ttsState?: TTSState;
  onTTSPlay?: () => void;
  onTTSPause?: () => void;
  onExpand?: () => void;
}

export function PsalmCard({ referencia, refrao, texto, ttsState, onTTSPlay, onTTSPause, onExpand }: Props) {
  const { colors } = useAppTheme();
  const [expanded, setExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [texto]);

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
      <div className={styles.labelRow}>
        <span className={styles.label}>SALMO RESPONSORIAL</span>
        {onTTSPlay && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              ttsState === "playing" ? onTTSPause?.() : onTTSPlay();
            }}
            className={[styles.ttsBtn, ttsState === "playing" && styles.ttsBtnActive].filter(Boolean).join(" ")}
            aria-label={ttsState === "playing" ? "Pausar leitura" : "Ouvir salmo"}
            aria-disabled={ttsState === "loading"}
          >
            {ttsState === "playing" ? (
              <Pause size={13} color={colors.primary} fill={colors.primary} />
            ) : (
              <Play size={13} color={colors.primary} fill={colors.primary} />
            )}
          </span>
        )}
      </div>

      <p className={styles.referencia}>{referencia}</p>

      {!!refrao && (
        <div className={styles.refraoBlock}>
          <p className={styles.refraoLabel}>Refrão</p>
          <p className={styles.refraoText}>{refrao}</p>
        </div>
      )}

      <div className={styles.expandable} style={{ height: expanded ? contentHeight : 0 }}>
        <div ref={contentRef}>
          <p className={styles.texto}>{texto}</p>
        </div>
      </div>

      <div className={styles.footer}>
        <span className={styles.toggleText}>{expanded ? "Ocultar" : "Ver mais"}</span>
        <span className={[styles.arrow, expanded && styles.arrowExpanded].filter(Boolean).join(" ")}>
          <ChevronDown size={16} color={colors.primary} />
        </span>
      </div>
    </button>
  );
}
