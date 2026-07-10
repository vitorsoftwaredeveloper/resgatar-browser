"use client";

import { CoachTarget } from "@/components/CoachTarget";
import { CommunityGoalCardSkeleton } from "@/components/Skeleton/CommunityGoalCardSkeleton";
import { useAppTheme } from "@/context/ThemeContext";
import { useDashboardData } from "@/context/DashboardDataContext";
import { formatMoneyBRL } from "@/utils/helper";
import { CircleCheck, Target, UsersRound } from "lucide-react";
import styles from "./CommunityGoalCard.module.css";

// Portado de resgatar_app/src/components/CommunityGoalCard. useFocusEffect
// (react-navigation) vira leitura do DashboardDataContext, buscado uma única
// vez por sessão — evita refazer a requisição toda vez que a Dashboard
// remonta ao voltar de outra aba.

const MONTH_LABELS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function CommunityGoalCard() {
  const { colors } = useAppTheme();
  const { goalProgress: progress, goalLoading: loading } = useDashboardData();

  if (loading && !progress) return <CommunityGoalCardSkeleton />;

  if (!progress || !Number.isFinite(progress.percent)) return null;

  const percent = Math.max(0, Math.min(100, Math.round(progress.percent)));
  const reached = percent >= 100;
  const monthLabel = MONTH_LABELS[progress.month - 1] ?? "";

  // Uma faixa só (reached/high/mid/low) alimenta cor, legenda, destaque e
  // mensagem — todos concordam entre si em vez de checar o percentual várias
  // vezes espalhado pelo componente.
  const tier = reached
    ? "reached"
    : percent >= 70
      ? "high"
      : percent >= 30
        ? "mid"
        : "low";

  const accent =
    tier === "low"
      ? colors.error
      : tier === "mid"
        ? colors.waiting
        : colors.success;

  const caption = {
    reached: "meta atingida!",
    high: "quase lá!",
    mid: "no caminho certo",
    low: "vamos começar!",
  }[tier];

  // Fundo suave (mesmo token usado pros badges de status em outras telas,
  // já com variante dark mode em globals.css).
  const highlightBg = {
    reached: "var(--ok-soft)",
    high: "var(--ok-soft)",
    mid: "var(--warn-soft)",
    low: "var(--danger-soft)",
  }[tier];

  // Mensagem mais longa embaixo do "Faltam..." — tom sempre encorajador,
  // mesmo na faixa inicial (não é um alerta, é uma meta coletiva).
  const message = {
    reached: "Obrigado a todos que contribuíram para esse resultado!",
    high: "Estamos quase lá! Poucas contribuições faltam para fecharmos o mês.",
    mid: "Estamos avançando bem — continue contribuindo para chegarmos à meta.",
    low: "Toda contribuição ajuda a comunidade a crescer — bora começar o mês forte!",
  }[tier];

  return (
    <CoachTarget id="community-goal-card">
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.title}>
            Meta da comunidade · {monthLabel}
          </span>
        </div>

        <div className={styles.valueRow}>
          <span className={styles.percent} style={{ color: accent }}>
            {percent}%
          </span>
          <span className={styles.caption}>{caption}</span>
        </div>

        <div className={styles.track}>
          <div
            className={styles.fill}
            style={{ width: `${percent}%`, backgroundColor: accent }}
          />
        </div>

        <div
          className={styles.highlightBox}
          style={{ background: highlightBg }}
        >
          <div className={styles.highlightRow}>
            {reached ? (
              <CircleCheck size={15} color={colors.success} />
            ) : (
              <Target size={15} color={accent} />
            )}
            <span className={styles.highlightText}>
              {reached ? (
                "Meta atingida!"
              ) : (
                <>
                  Faltam{" "}
                  <span className={styles.remainingStrong}>
                    {formatMoneyBRL(progress.remaining)}
                  </span>{" "}
                  para a meta
                </>
              )}
            </span>
          </div>
          <p className={styles.highlightMessage}>{message}</p>
        </div>
      </div>
    </CoachTarget>
  );
}
