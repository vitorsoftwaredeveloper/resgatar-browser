"use client";

import { useAppTheme } from "@/context/ThemeContext";
import { ChevronDown, Pause, Play } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
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
  // Número de versículo = dígitos seguidos da 1ª letra OU de uma aspa de
  // abertura (muitos versículos começam com fala: 2"Volta..., 16"Eis...).
  // Sem incluir as aspas no lookahead, esses números ficavam sem marcação.
  const parts = text.split(/(\d+)(?=[A-Za-zÀ-ÿ"'“”‘’«»])/);
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

  // Detecta quando as abas não cabem numa linha só. Cabendo, mostra as abas
  // (segmented control); não cabendo, colapsa num dropdown ("escolher leitura").
  // As abas continuam no DOM (escondidas via max-height:0, ver .tabsCollapsed)
  // pra que o offsetTop siga medindo e o dropdown volte a virar abas ao alargar.
  const tabsRef = useRef<HTMLDivElement>(null);
  const [tabsWrapped, setTabsWrapped] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const check = () => {
      const items = Array.from(el.children) as HTMLElement[];
      if (items.length === 0) return;
      const firstTop = items[0].offsetTop;
      const wrapped = items.some((it) => it.offsetTop !== firstTop);
      setTabsWrapped(wrapped);
      // Voltou a caber → o dropdown some, então garante o menu fechado.
      if (!wrapped) setMenuOpen(false);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sections.length]);

  // Preserva a aba escolhida ao trocar de data; se a seção não existir nesse
  // dia (ex.: Segunda Leitura só aos domingos) cai na primeira disponível.
  const active = sections.find((s) => s.id === activeId) ?? sections[0];
  if (!active) return null;

  const tts = getTTS(active.id, active.ttsText);

  return (
    <div className={styles.panel}>
      <div className={styles.tabsWrap}>
        <div
          ref={tabsRef}
          className={[styles.tabs, tabsWrapped && styles.tabsCollapsed]
            .filter(Boolean)
            .join(" ")}
          role="tablist"
          aria-hidden={tabsWrapped || undefined}
        >
          {sections.map((section) => {
            const selected = section.id === active.id;
            return (
              <button
                key={section.id}
                type="button"
                role="tab"
                aria-selected={selected}
                tabIndex={tabsWrapped ? -1 : undefined}
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

        {tabsWrapped && (
          <div className={styles.select}>
            <button
              type="button"
              className={styles.selectTrigger}
              aria-haspopup="listbox"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className={styles.selectLabel}>{active.label}</span>
              <ChevronDown
                size={18}
                color={colors.primary}
                className={[styles.selectChevron, menuOpen && styles.selectChevronOpen]
                  .filter(Boolean)
                  .join(" ")}
              />
            </button>

            {menuOpen && (
              <>
                <div
                  className={styles.selectBackdrop}
                  onClick={() => setMenuOpen(false)}
                />
                <ul className={styles.selectList} role="listbox">
                  {sections.map((section) => {
                    const selected = section.id === active.id;
                    return (
                      <li key={section.id} role="option" aria-selected={selected}>
                        <button
                          type="button"
                          className={[
                            styles.selectOption,
                            selected && styles.selectOptionActive,
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          onClick={() => {
                            onSelectSection(section.id);
                            setMenuOpen(false);
                          }}
                        >
                          {section.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        )}
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
