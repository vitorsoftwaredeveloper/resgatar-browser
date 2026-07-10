"use client";

import { CalendarModal } from "@/components/CalendarModal";
import { DateNavigator } from "@/components/DateNavigator";
import {
  DesktopLiturgyReader,
  DesktopLiturgyReaderSkeleton,
  type LiturgySection,
} from "@/components/DesktopLiturgyReader";
import { Header } from "@/components/Header";
import { MarkReadingButton } from "@/components/MarkReadingButton";
import { StreakCard } from "@/components/StreakCard";
import { ToastMessage } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useLiturgyTTS } from "@/hooks/useLiturgyTTS";
import { useMediaQuery } from "@/hooks/useBreakpoint";
import { BREAKPOINTS } from "@/styles/breakpoints";
import { LiturgyService } from "@/services/LiturgyService";
import { ReadingStreakService } from "@/services/ReadingStreakService";
import { ILiturgia, LITURGICAL_ACCENT } from "@/types/Liturgy";
import { Pause, Quote, RefreshCw, Volume2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import styles from "./readings.module.css";

// Portado de resgatar_app/src/screens/ReadingsScreen. useFocusEffect
// (react-navigation) e useBottomTabBarHeight não têm equivalente aqui — o
// layout de abas já reserva o espaço do TabBar (ver (tabs)/layout.tsx), então a
// busca acontece direto no useEffect (mount + troca de data).

function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// lastReadAt vem da API como "YYYY-MM-DD" (sem horário). `new Date(string)`
// interpretaria isso como UTC meia-noite, que em fusos negativos (Brasil)
// pode cair no dia anterior ao comparar com a data local — por isso o parse
// manual, igual ao StreakCard.
function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// "Terça-feira, 7 de julho" — usado no eyebrow do cabeçalho desktop (sem o
// ano, que já fica implícito pelo contexto da tela).
function formatEyebrowDate(date: Date): string {
  const label = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// Citação de destaque do trilho lateral (desktop): a primeira frase do
// Evangelho do dia, sem parafrasear — é conteúdo real vindo da API, só
// recortado para caber como epígrafe.
function buildQuote(liturgy: ILiturgia): { text: string; ref: string } | null {
  const evangelho = liturgy.leituras.evangelho;
  if (!evangelho?.texto) return null;
  const clean = evangelho.texto.replace(/\s+/g, " ").trim();
  const firstSentence = clean.split(/(?<=[.!?])\s/)[0] ?? clean;
  const text =
    firstSentence.length > 160
      ? `${firstSentence.slice(0, 157).trimEnd()}…`
      : firstSentence;
  return { text, ref: evangelho.referencia };
}

function buildSectionText(
  titulo: string,
  referencia: string,
  texto: string,
  formulaFinal?: string,
): string {
  return [titulo, referencia, texto, formulaFinal].filter(Boolean).join(". ");
}

// Achata a liturgia nas seções exibidas como abas no desktop. A ordem espelha
// os cards do mobile; Segunda Leitura e Oração do Dia entram só quando existem.
function buildSections(liturgy: ILiturgia): LiturgySection[] {
  const { leituras, oracoes } = liturgy;
  const sections: LiturgySection[] = [
    {
      id: "primeira-leitura",
      label: "Primeira Leitura",
      referencia: leituras.primeiraLeitura.referencia,
      titulo: leituras.primeiraLeitura.titulo,
      texto: leituras.primeiraLeitura.texto,
      formulaFinal: "Palavra do Senhor.",
      ttsText: buildSectionText(
        "Primeira leitura",
        leituras.primeiraLeitura.referencia,
        leituras.primeiraLeitura.texto,
        "Palavra do Senhor.",
      ),
    },
    {
      id: "salmo",
      label: "Salmo",
      referencia: leituras.salmo.referencia,
      refrao: leituras.salmo.refrao,
      texto: leituras.salmo.texto,
      ttsText: buildSectionText(
        "Salmo responsorial",
        leituras.salmo.referencia,
        leituras.salmo.texto,
      ),
    },
  ];

  if (leituras.segundaLeitura) {
    sections.push({
      id: "segunda-leitura",
      label: "Segunda Leitura",
      referencia: leituras.segundaLeitura.referencia,
      titulo: leituras.segundaLeitura.titulo,
      texto: leituras.segundaLeitura.texto,
      formulaFinal: "Palavra do Senhor.",
      ttsText: buildSectionText(
        "Segunda leitura",
        leituras.segundaLeitura.referencia,
        leituras.segundaLeitura.texto,
        "Palavra do Senhor.",
      ),
    });
  }

  sections.push({
    id: "evangelho",
    label: "Evangelho",
    referencia: leituras.evangelho.referencia,
    titulo: leituras.evangelho.titulo,
    texto: leituras.evangelho.texto,
    formulaFinal: "Palavra da Salvação.",
    ttsText: buildSectionText(
      "Evangelho",
      leituras.evangelho.referencia,
      leituras.evangelho.texto,
      "Palavra da Salvação.",
    ),
  });

  if (oracoes?.coleta) {
    sections.push({
      id: "oracao",
      label: "Oração do Dia",
      referencia: "",
      texto: oracoes.coleta,
      ttsText: oracoes.coleta,
    });
  }

  return sections;
}

export default function ReadingsPage() {
  const { member, updateMemberStreak } = useAuth();
  const { colors } = useAppTheme();
  // Trilho lateral (ofensiva + citação do Evangelho) só no desktop (>=1024px).
  // Abaixo disso, mobile e tablet compartilham o mesmo leitor de coluna única:
  // a navegação de abas do leitor e o datepicker no estilo editorial, mas sem
  // o trilho — nada de card de ofensiva nem de citação do primeiro versículo.
  const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.desktop}px)`);

  const [selectedDate, setSelectedDate] = useState<Date>(today());
  const [activeSectionId, setActiveSectionId] = useState("primeira-leitura");
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [liturgy, setLiturgy] = useState<ILiturgia | null>(null);
  const [error, setError] = useState(false);
  const [marking, setMarking] = useState(false);

  const {
    activeId,
    state: ttsState,
    playSection,
    pause,
    stop,
  } = useLiturgyTTS();

  const memberId = member?._id;

  const isViewingToday = isSameDay(selectedDate, today());

  const lastReadAt = member?.readingStreak?.lastReadAt;
  const alreadyReadToday = lastReadAt
    ? isSameDay(parseDateKey(lastReadAt), today())
    : false;
  const streakCount = member?.readingStreak?.currentStreak ?? 0;

  const handleMarkRead = useCallback(async () => {
    if (!memberId) return;
    setMarking(true);
    try {
      const streak = await ReadingStreakService.markToday();
      updateMemberStreak(streak);
      ToastMessage.success(
        "Leitura de hoje realizada",
        "Mais um dia somado à sua ofensiva.",
      );
    } catch {
      ToastMessage.error(
        "Não foi possível registrar",
        "Verifique sua conexão e tente novamente.",
      );
    } finally {
      setMarking(false);
    }
  }, [memberId, updateMemberStreak]);

  const fetchLiturgy = useCallback(async (date: Date, force = false) => {
    stop();
    setError(false);
    try {
      const isToday = isSameDay(date, today());
      const data = isToday
        ? await LiturgyService.getToday(force)
        : await LiturgyService.getByDate(date);
      setLiturgy(data);
    } catch {
      setError(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchLiturgy(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const handlePrev = useCallback(() => {
    setSelectedDate((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() - 1);
      return next;
    });
  }, []);

  const handleNext = useCallback(() => {
    setSelectedDate((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      return next;
    });
  }, []);

  const handleBackToToday = useCallback(() => {
    setSelectedDate(today());
  }, []);

  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const sectionTTSProps = useCallback(
    (id: string, text: string) => ({
      ttsState: activeId === id ? ttsState : ("idle" as const),
      onTTSPlay: () => {
        playSection(id, text);
      },
      onTTSPause: pause,
    }),
    [activeId, ttsState, playSection, pause],
  );

  return (
    <div className={styles.container}>
      <Header
        name={`${member?.firstName ?? ""} ${member?.lastName ?? ""}`}
        photo={member?.profileImage}
        crumbs={[{ label: "Leituras" }]}
      />

      <div className={styles.content}>
        {isDesktop ? (
          <>
            <div className={styles.pageHead}>
              {liturgy ? (
                <>
                  <p className="eyebrow">
                    Liturgia do dia · {formatEyebrowDate(selectedDate)}
                  </p>
                  <h1 className={styles.pageTitle}>{liturgy.liturgia}</h1>
                  <span
                    className={styles.colorPill}
                    style={{
                      color: LITURGICAL_ACCENT[liturgy.cor],
                      background: `color-mix(in srgb, ${LITURGICAL_ACCENT[liturgy.cor]} 16%, var(--surface))`,
                    }}
                  >
                    <span
                      className={styles.colorDot}
                      style={{ background: "currentColor" }}
                    />
                    {liturgy.cor}
                  </span>
                </>
              ) : (
                <div className="skeleton-pulse" aria-hidden="true">
                  <span className={styles.skelEyebrow} />
                  <span className={styles.skelTitle} />
                </div>
              )}
            </div>

            {ttsState !== "idle" && (
              <button
                type="button"
                onClick={ttsState === "playing" ? pause : stop}
                className={styles.ttsIndicator}
                disabled={ttsState === "loading"}
              >
                <Volume2 size={14} color={colors.primary} />
                <span className={styles.ttsIndicatorText}>
                  {ttsState === "loading"
                    ? "Gerando áudio..."
                    : ttsState === "playing"
                      ? "Reproduzindo áudio"
                      : "Áudio pausado"}
                </span>
                {ttsState === "playing" ? (
                  <Pause size={14} color={colors.primary} />
                ) : (
                  <RefreshCw size={14} color={colors.primary} />
                )}
              </button>
            )}

            <div className={styles.readingsGrid}>
              {error ? (
                <div className={styles.errorCard}>
                  <p className={styles.errorTitle}>Não foi possível carregar</p>
                  <p className={styles.errorSubtitle}>
                    Verifique sua conexão e tente novamente.
                  </p>
                  <button
                    type="button"
                    className={styles.retryButton}
                    onClick={() => fetchLiturgy(selectedDate, true)}
                  >
                    <RefreshCw size={16} color={colors.primary} />
                    <span className={styles.retryText}>Tentar novamente</span>
                  </button>
                </div>
              ) : liturgy ? (
                <DesktopLiturgyReader
                  sections={buildSections(liturgy)}
                  activeId={activeSectionId}
                  onSelectSection={setActiveSectionId}
                  getTTS={sectionTTSProps}
                />
              ) : (
                <DesktopLiturgyReaderSkeleton />
              )}

              {/* O trilho (calendário e ofensiva) não depende da liturgia do
                  dia selecionado — fica sempre montado, então trocar de dia
                  não some com nada, só a coluna principal ao lado pulsa. */}
              <div className={styles.rail}>
                <DateNavigator
                  selectedDate={selectedDate}
                  onPrev={handlePrev}
                  onNext={handleNext}
                  onOpenCalendar={() => setCalendarVisible(true)}
                  onBackToToday={handleBackToToday}
                />

                {liturgy &&
                  isViewingToday &&
                  !alreadyReadToday && (
                    <MarkReadingButton
                      streakCount={streakCount}
                      loading={marking}
                      onPress={handleMarkRead}
                    />
                  )}

                <StreakCard />

                {liturgy ? (
                  (() => {
                    const quote = buildQuote(liturgy);
                    if (!quote) return null;
                    return (
                      <div className={styles.quoteCard}>
                        <Quote
                          size={22}
                          strokeWidth={1.4}
                          className={styles.quoteIcon}
                        />
                        <p className={styles.quoteText}>
                          &ldquo;{quote.text}&rdquo;
                        </p>
                        <span className={styles.quoteRef}>{quote.ref}</span>
                      </div>
                    );
                  })()
                ) : !error ? (
                  <div
                    className={`${styles.quoteCardSkeleton} skeleton-pulse`}
                    aria-hidden="true"
                  >
                    <span style={{ width: "90%" }} />
                    <span style={{ width: "70%" }} />
                    <span style={{ width: "40%" }} />
                  </div>
                ) : null}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={styles.pageHead}>
              {liturgy ? (
                <>
                  <p className="eyebrow">
                    Liturgia do dia · {formatEyebrowDate(selectedDate)}
                  </p>
                  <h1 className={styles.pageTitle}>{liturgy.liturgia}</h1>
                  <span
                    className={styles.colorPill}
                    style={{
                      color: LITURGICAL_ACCENT[liturgy.cor],
                      background: `color-mix(in srgb, ${LITURGICAL_ACCENT[liturgy.cor]} 16%, var(--surface))`,
                    }}
                  >
                    <span
                      className={styles.colorDot}
                      style={{ background: "currentColor" }}
                    />
                    {liturgy.cor}
                  </span>
                </>
              ) : (
                <div className="skeleton-pulse" aria-hidden="true">
                  <span className={styles.skelEyebrow} />
                  <span className={styles.skelTitle} />
                </div>
              )}
            </div>

            <DateNavigator
              selectedDate={selectedDate}
              onPrev={handlePrev}
              onNext={handleNext}
              onOpenCalendar={() => setCalendarVisible(true)}
              onBackToToday={handleBackToToday}
            />

            {liturgy && isViewingToday && !alreadyReadToday && (
              <MarkReadingButton
                streakCount={streakCount}
                loading={marking}
                onPress={handleMarkRead}
              />
            )}

            {ttsState !== "idle" && (
              <button
                type="button"
                onClick={ttsState === "playing" ? pause : stop}
                className={styles.ttsIndicator}
                disabled={ttsState === "loading"}
              >
                <Volume2 size={14} color={colors.primary} />
                <span className={styles.ttsIndicatorText}>
                  {ttsState === "loading"
                    ? "Gerando áudio..."
                    : ttsState === "playing"
                      ? "Reproduzindo áudio"
                      : "Áudio pausado"}
                </span>
                {ttsState === "playing" ? (
                  <Pause size={14} color={colors.primary} />
                ) : (
                  <RefreshCw size={14} color={colors.primary} />
                )}
              </button>
            )}

            {error ? (
              <div className={styles.errorContainer}>
                <p className={styles.errorTitle}>Não foi possível carregar</p>
                <p className={styles.errorSubtitle}>
                  Verifique sua conexão e tente novamente.
                </p>
                <button
                  type="button"
                  className={styles.retryButton}
                  onClick={() => fetchLiturgy(selectedDate, true)}
                >
                  <RefreshCw size={16} color={colors.primary} />
                  <span className={styles.retryText}>Tentar novamente</span>
                </button>
              </div>
            ) : liturgy ? (
              <DesktopLiturgyReader
                sections={buildSections(liturgy)}
                activeId={activeSectionId}
                onSelectSection={setActiveSectionId}
                getTTS={sectionTTSProps}
              />
            ) : (
              <DesktopLiturgyReaderSkeleton />
            )}
          </>
        )}
      </div>

      <CalendarModal
        visible={calendarVisible}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        onClose={() => setCalendarVisible(false)}
      />
    </div>
  );
}
