"use client";

import { CalendarModal } from "@/components/CalendarModal";
import { DateNavigator } from "@/components/DateNavigator";
import {
  DesktopLiturgyReader,
  DesktopLiturgyReaderSkeleton,
  type LiturgySection,
} from "@/components/DesktopLiturgyReader";
import { Header } from "@/components/Header";
import { LiturgySeasonBanner } from "@/components/LiturgySeasonBanner";
import { MarkReadingButton } from "@/components/MarkReadingButton";
import { PsalmCard } from "@/components/PsalmCard";
import { ReadingCard } from "@/components/ReadingCard";
import { LiturgySkeleton } from "@/components/Skeleton/LiturgySkeleton";
import { StreakCard } from "@/components/StreakCard";
import { ToastMessage } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useLiturgyTTS } from "@/hooks/useLiturgyTTS";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { LiturgyService } from "@/services/LiturgyService";
import { ReadingStreakService } from "@/services/ReadingStreakService";
import {
  getReadingMarkedDate,
  setReadingMarkedDate,
} from "@/storage/localStorage";
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
  const { isDesktop } = useBreakpoint();

  const [selectedDate, setSelectedDate] = useState<Date>(today());
  const [activeSectionId, setActiveSectionId] = useState("primeira-leitura");
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [liturgy, setLiturgy] = useState<ILiturgia | null>(null);
  const [error, setError] = useState(false);
  const [marking, setMarking] = useState(false);
  const [markDismissed, setMarkDismissed] = useState(false);

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
    ? isSameDay(new Date(lastReadAt), today())
    : false;
  const streakCount = member?.readingStreak?.currentStreak ?? 0;

  useEffect(() => {
    if (!memberId) return;
    getReadingMarkedDate(memberId).then((storedDate) => {
      if (storedDate) {
        const d = new Date(storedDate);
        if (isSameDay(d, today())) setMarkDismissed(true);
      }
    });
  }, [memberId]);

  const handleMarkRead = useCallback(async () => {
    if (!memberId) return;
    setMarking(true);
    try {
      const streak = await ReadingStreakService.markToday();
      await setReadingMarkedDate(memberId, new Date().toISOString());
      updateMemberStreak(streak);
      setMarkDismissed(true);
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
    setLoading(true);
    setError(false);
    try {
      const isToday = isSameDay(date, today());
      const data = isToday
        ? await LiturgyService.getToday(force)
        : await LiturgyService.getByDate(date);
      setLiturgy(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchLiturgy(selectedDate);
    if (memberId) {
      getReadingMarkedDate(memberId).then((storedDate) => {
        setMarkDismissed(
          !!storedDate && isSameDay(new Date(storedDate), today()),
        );
      });
    } else {
      setMarkDismissed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, memberId]);

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
                  !alreadyReadToday &&
                  !markDismissed && (
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
        ) : loading ? (
          <>
            <DateNavigator
              selectedDate={selectedDate}
              onPrev={handlePrev}
              onNext={handleNext}
              onOpenCalendar={() => setCalendarVisible(true)}
              onBackToToday={handleBackToToday}
            />
            <LiturgySkeleton />
          </>
        ) : error ? (
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
          <>
            <DateNavigator
              selectedDate={selectedDate}
              onPrev={handlePrev}
              onNext={handleNext}
              onOpenCalendar={() => setCalendarVisible(true)}
              onBackToToday={handleBackToToday}
            />

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

            {isViewingToday && !alreadyReadToday && !markDismissed && (
              <MarkReadingButton
                streakCount={streakCount}
                loading={marking}
                onPress={handleMarkRead}
              />
            )}

            <LiturgySeasonBanner
              liturgia={liturgy.liturgia}
              data={liturgy.data}
              cor={liturgy.cor}
            />

            <ReadingCard
              testID="card-primeira-leitura"
              coachId="reading-tts-btn"
              label="PRIMEIRA LEITURA"
              referencia={liturgy.leituras.primeiraLeitura.referencia}
              titulo={liturgy.leituras.primeiraLeitura.titulo}
              texto={liturgy.leituras.primeiraLeitura.texto}
              formulaFinal="Palavra do Senhor."
              {...sectionTTSProps(
                "primeira-leitura",
                buildSectionText(
                  "Primeira leitura",
                  liturgy.leituras.primeiraLeitura.referencia,
                  liturgy.leituras.primeiraLeitura.texto,
                  "Palavra do Senhor.",
                ),
              )}
            />

            <PsalmCard
              testID="card-salmo"
              referencia={liturgy.leituras.salmo.referencia}
              refrao={liturgy.leituras.salmo.refrao}
              texto={liturgy.leituras.salmo.texto}
              {...sectionTTSProps(
                "salmo",
                buildSectionText(
                  "Salmo responsorial",
                  liturgy.leituras.salmo.referencia,
                  liturgy.leituras.salmo.texto,
                ),
              )}
            />

            {!!liturgy.leituras.segundaLeitura && (
              <ReadingCard
                testID="card-segunda-leitura"
                label="SEGUNDA LEITURA"
                referencia={liturgy.leituras.segundaLeitura.referencia}
                titulo={liturgy.leituras.segundaLeitura.titulo}
                texto={liturgy.leituras.segundaLeitura.texto}
                formulaFinal="Palavra do Senhor."
                {...sectionTTSProps(
                  "segunda-leitura",
                  buildSectionText(
                    "Segunda leitura",
                    liturgy.leituras.segundaLeitura.referencia,
                    liturgy.leituras.segundaLeitura.texto,
                    "Palavra do Senhor.",
                  ),
                )}
              />
            )}

            <ReadingCard
              testID="card-evangelho"
              label="EVANGELHO"
              referencia={liturgy.leituras.evangelho.referencia}
              titulo={liturgy.leituras.evangelho.titulo}
              texto={liturgy.leituras.evangelho.texto}
              formulaFinal="Palavra da Salvação."
              {...sectionTTSProps(
                "evangelho",
                buildSectionText(
                  "Evangelho",
                  liturgy.leituras.evangelho.referencia,
                  liturgy.leituras.evangelho.texto,
                  "Palavra da Salvação.",
                ),
              )}
            />

            {!!liturgy.oracoes?.coleta && (
              <ReadingCard
                testID="card-oracao"
                label="ORAÇÃO DO DIA"
                referencia=""
                texto={liturgy.oracoes.coleta}
                {...sectionTTSProps("oracao", liturgy.oracoes.coleta)}
              />
            )}
          </>
        ) : null}
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
