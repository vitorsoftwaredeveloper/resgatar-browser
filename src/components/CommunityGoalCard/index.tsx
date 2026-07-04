"use client";

import { CoachTarget } from "@/components/CoachTarget";
import { CommunityGoalCardSkeleton } from "@/components/Skeleton/CommunityGoalCardSkeleton";
import { useAppTheme } from "@/context/ThemeContext";
import { ChargeServices } from "@/services/ChargeService";
import { IGoalProgress } from "@/types/Charge";
import { CircleCheck, UsersRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import styles from "./CommunityGoalCard.module.css";

// Portado de resgatar_app/src/components/CommunityGoalCard. useFocusEffect
// (react-navigation) vira useEffect no mount — este projeto ainda não tem
// rotas/tabs, então não há "voltar ao focar a tela" para recarregar ainda.

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
  const [progress, setProgress] = useState<IGoalProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await ChargeServices.getGoalProgress();
      setProgress(data);
    } catch {
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !progress) return <CommunityGoalCardSkeleton />;

  if (!progress || !Number.isFinite(progress.percent)) return null;

  const percent = Math.max(0, Math.min(100, Math.round(progress.percent)));
  const reached = percent >= 100;
  const monthLabel = MONTH_LABELS[progress.month - 1] ?? "";

  const accent = percent >= 70 ? colors.success : percent >= 30 ? colors.waiting : colors.error;

  return (
    <CoachTarget id="community-goal-card">
      <div className={styles.card}>
        <div className={styles.header}>
          <UsersRound size={18} color={colors.primary} />
          <span className={styles.title}>Meta da comunidade · {monthLabel}</span>
        </div>

        <div className={styles.valueRow}>
          <span className={styles.percent} style={{ color: accent }}>
            {percent}%
          </span>
          <span className={styles.caption}>{reached ? "meta atingida!" : "da meta atingida"}</span>
        </div>

        <div className={styles.track}>
          <div className={styles.fill} style={{ width: `${percent}%`, backgroundColor: accent }} />
        </div>

        {reached && (
          <div className={styles.reachedRow}>
            <CircleCheck size={15} color={colors.success} />
            <span className={styles.reachedText}>Meta atingida! Obrigado a todos que contribuíram.</span>
          </div>
        )}
      </div>
    </CoachTarget>
  );
}
