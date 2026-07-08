"use client";

import { useAppTheme } from "@/context/ThemeContext";
import { Pause, Play } from "lucide-react";
import { Fragment } from "react";
import styles from "./DesktopLiturgyReader.module.css";

// Variante desktop (>=1024px) da tela de Leituras. No mobile as seções ficam
// empilhadas em cards expansíveis; aqui elas viram abas horizontais e o texto
// completo da aba ativa é exibido de imediato. O DateNavigator (faixa da
// semana) continua no topo, renderizado pela própria página como no mobile.

type TTSState = "idle" | "loading" | "playing" | "paused";

export interface LiturgySection {
  id: string;
  label: string;
  referencia: string;
  titulo?: string;
  refrao?: string;
  texto: string;
  formulaFinal?: string;
  ttsText: string;
}

interface Props {
  sections: LiturgySection[];
  // Aba ativa controlada pela página — sobrevive ao loading da troca de data,
  // que desmontaria um estado local deste componente.
  activeId: string;
  onSelectSection: (id: string) => void;
  getTTS: (
    id: string,
    text: string,
  ) => {
    ttsState: TTSState;
    onTTSPlay: () => void;
    onTTSPause: () => void;
  };
}

function formatVerseText(text: string, verseClass: string) {
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

export function DesktopLiturgyReader({
  sections,
  activeId,
  onSelectSection,
  getTTS,
}: Props) {
  const { colors } = useAppTheme();

  // Preserva a aba escolhida ao trocar de data; se a seção não existir nesse
  // dia (ex.: Segunda Leitura só aos domingos) cai na primeira disponível.
  const active = sections.find((s) => s.id === activeId) ?? sections[0];
  if (!active) return null;

  const tts = getTTS(active.id, active.ttsText);

  return (
    <div className={styles.panel}>
      <div className={styles.tabsWrap}>
        <div className={styles.tabs} role="tablist">
          {sections.map((section) => {
            const selected = section.id === active.id;
            return (
              <button
                key={section.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={[styles.tab, selected && styles.tabActive]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onSelectSection(section.id)}
              >
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      <article className={styles.reading}>
        <div className={styles.readingHeader}>
          <div className={styles.readingHeadings}>
            <span className={styles.readingLabel}>
              {active.label.toUpperCase()}
            </span>
            {!!active.referencia && (
              <p className={styles.referencia}>{active.referencia}</p>
            )}
            {!!active.titulo && (
              <p className={styles.titulo}>{active.titulo}</p>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              tts.ttsState === "playing" ? tts.onTTSPause() : tts.onTTSPlay()
            }
            className={[
              styles.ttsBtn,
              tts.ttsState === "playing" && styles.ttsBtnActive,
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label={
              tts.ttsState === "playing" ? "Pausar leitura" : "Ouvir leitura"
            }
            aria-disabled={tts.ttsState === "loading"}
          >
            {tts.ttsState === "playing" ? (
              <Pause size={20} color={colors.primary} fill={colors.primary} />
            ) : (
              <Play size={20} color={colors.primary} fill={colors.primary} />
            )}
          </button>
        </div>

        <hr className={styles.hairline} />

        {!!active.refrao && (
          <div className={styles.refraoBlock}>
            <p className={styles.refraoText}>{active.refrao}</p>
          </div>
        )}

        <p className={styles.texto}>
          {formatVerseText(active.texto, styles.verseNumber)}
        </p>
        {!!active.formulaFinal && (
          <p className={styles.formulaFinal}>{`— ${active.formulaFinal}`}</p>
        )}
      </article>
    </div>
  );
}

// Placeholder do painel enquanto a liturgia do dia selecionado carrega. Ocupa
// o mesmo formato do painel real (abas + card de leitura) para que trocar de
// dia no trilho não faça a coluna principal sumir/realinhar — só o conteúdo
// pulsa até chegar a resposta.
export function DesktopLiturgyReaderSkeleton() {
  return (
    <div className={`${styles.panel} skeleton-pulse`} aria-hidden="true">
      <div className={styles.tabsWrap}>
        <div className={styles.tabs}>
          {[92, 68, 96, 120].map((w, i) => (
            <span key={i} className={styles.skelTab} style={{ width: w }} />
          ))}
        </div>
      </div>

      <div className={styles.reading}>
        <div className={styles.readingHeader}>
          <div className={styles.readingHeadings}>
            <span className={styles.skelLabel} />
            <span className={styles.skelRef} />
            <span className={styles.skelTitulo} />
          </div>
          <span className={styles.skelTtsBtn} />
        </div>

        <hr className={styles.hairline} />

        <span className={styles.skelLine} style={{ width: "94%" }} />
        <span className={styles.skelLine} style={{ width: "88%" }} />
        <span className={styles.skelLine} style={{ width: "97%" }} />
        <span className={styles.skelLine} style={{ width: "62%" }} />
      </div>
    </div>
  );
}
