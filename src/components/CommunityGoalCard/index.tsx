"use client";

import { CoachTarget } from "@/components/CoachTarget";
import { ModalSetGoal } from "@/components/ModalSetGoal";
import { CommunityGoalCardSkeleton } from "@/components/Skeleton/CommunityGoalCardSkeleton";
import { useAppTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useDashboardData } from "@/context/DashboardDataContext";
import { formatMoneyBRL } from "@/utils/helper";
import { CircleCheck, HandCoins, Pencil, Receipt, Target, Wallet } from "lucide-react";
import { useState } from "react";
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
  const { member } = useAuth();
  const { goalProgress: progress, goalLoading: loading, refetchGoalProgress } =
    useDashboardData();
  const [editing, setEditing] = useState(false);

  const isAdmin = member?.role === "admin";

  if (loading && !progress) return <CommunityGoalCardSkeleton />;

  if (!progress || !Number.isFinite(progress.achievedPercent)) {
    return (
      <CoachTarget id="community-goal-card">
        <div className={styles.card}>
          <div className={styles.header}>
            <span className={styles.title}>Meta da comunidade</span>
          </div>

          <div className={styles.emptyState}>
            <Target size={22} color="var(--color-text-muted)" />
            <p className={styles.emptyText}>Nenhuma meta definida para este mês</p>
          </div>
        </div>
      </CoachTarget>
    );
  }

  const percent = Math.max(0, Math.min(100, Math.round(progress.achievedPercent)));
  const reached = progress.goalReached;
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
          {isAdmin && (
            <button
              type="button"
              className={styles.editButton}
              onClick={() => setEditing(true)}
              aria-label="Editar meta do mês"
            >
              <Pencil size={14} color="var(--color-text-muted)" />
            </button>
          )}
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

        <div className={styles.breakdown}>
          <div className={styles.breakdownItem}>
            <div className={styles.breakdownLabel}>
              <Wallet size={13} color="var(--color-text-muted)" />
              <span>Mensalidades</span>
            </div>
            <span className={styles.breakdownValue}>
              {formatMoneyBRL(progress.collected)}
            </span>
          </div>

          <div className={styles.breakdownItem}>
            <div className={styles.breakdownLabel}>
              <HandCoins size={13} color={colors.success} />
              <span>Doações</span>
            </div>
            <span
              className={styles.breakdownValue}
              style={{ color: colors.success }}
            >
              +{formatMoneyBRL(progress.donations)}
            </span>
          </div>

          {/* Despesas são informativas — não entram no cálculo da meta, então
              sem o "−" que sugeria subtração, mas em vermelho como valor de saída. */}
          <div className={styles.breakdownItem}>
            <div className={styles.breakdownLabel}>
              <Receipt size={13} color={colors.error} />
              <span>Despesas</span>
            </div>
            <span
              className={styles.breakdownValue}
              style={{ color: colors.error }}
            >
              {formatMoneyBRL(progress.expenses)}
            </span>
          </div>
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
                    {100 - percent}%
                  </span>{" "}
                  para a meta
                </>
              )}
            </span>
          </div>
          <p className={styles.highlightMessage}>{message}</p>
        </div>
      </div>

      {isAdmin && (
        <ModalSetGoal
          visible={editing}
          onClose={() => setEditing(false)}
          onSaved={refetchGoalProgress}
          year={progress.year}
          month={progress.month}
          monthLabel={monthLabel}
          currentGoal={progress.targetGoal}
        />
      )}
    </CoachTarget>
  );
}
