"use client";

import { CoachTarget } from "@/components/CoachTarget";
import { NoticesCardSkeleton } from "@/components/Skeleton/NoticesCardSkeleton";
import { useAppTheme } from "@/context/ThemeContext";
import { useDashboardData } from "@/context/DashboardDataContext";
import { TRANSACTION_STATUS } from "@/types/Charge";
import { formatMoneyBRL } from "@/utils/helper";
import { Banknote, QrCode } from "lucide-react";
import styles from "./RecentDonationsCard.module.css";

// Prévia das doações avulsas do mês corrente — visível pra qualquer membro,
// só leitura (sem link pra nenhuma tela).

const DISPLAY_LIMIT = 5;

export function RecentDonationsCard() {
  const { colors } = useAppTheme();
  const { donations, donationsLoading: loading } = useDashboardData();

  const items = donations.slice(0, DISPLAY_LIMIT);
  const loaded = !loading;

  return (
    <CoachTarget id="recent-donations-card">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.headerTitle}>Doações do mês</span>
        </div>

        {!loaded ? (
          <NoticesCardSkeleton rows={3} />
        ) : items.length === 0 ? (
          <p className={styles.emptyText}>Nenhuma doação registrada neste mês.</p>
        ) : (
          items.map((item, i) => {
            const isPix = item.paymentMethodId === "pix";
            const isApproved = item.status === TRANSACTION_STATUS.APPROVED;
            return (
              <div key={item.transactionId} className={[styles.row, i < items.length - 1 && styles.rowBorder].filter(Boolean).join(" ")}>
                <div className={styles.methodIcon}>
                  {isPix ? <QrCode size={16} color={colors.info} /> : <Banknote size={16} color={colors.success} />}
                </div>
                <div className={styles.texts}>
                  <p className={styles.name}>{item.donorName?.trim() || "Anônimo"}</p>
                  <p className={styles.meta}>{isPix ? "PIX" : "Dinheiro"}</p>
                </div>
                <div className={styles.values}>
                  <span className={styles.value}>{formatMoneyBRL(item.amount)}</span>
                  {!isApproved && (
                    <span className={styles.status}>
                      {item.status === TRANSACTION_STATUS.PENDING ? "Pendente" : "Não confirmada"}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </CoachTarget>
  );
}
