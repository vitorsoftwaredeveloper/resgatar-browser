"use client";

import { CoachTarget } from "@/components/CoachTarget";
import { NoticesCardSkeleton } from "@/components/Skeleton/NoticesCardSkeleton";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useDashboardData } from "@/context/DashboardDataContext";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { TRANSACTION_STATUS } from "@/types/Charge";
import { formatMoneyBRL } from "@/utils/helper";
import { Banknote, ChevronRight, QrCode } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./RecentDonationsCard.module.css";

// Prévia das doações avulsas do mês corrente — dado financeiro, então segue o
// mesmo recorte de acesso da tela /donations (só aparece pra admin no hub
// Administrativo). O DashboardDataContext já nem busca doações pra membro
// comum, então aqui basta não renderizar nada.

const DISPLAY_LIMIT = 5;

export function RecentDonationsCard() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { member } = useAuth();
  const { isDesktop } = useBreakpoint();
  const isAdmin = member?.role === "admin";
  const { donations, donationsLoading: loading } = useDashboardData();

  if (!isAdmin) return null;

  const items = donations.slice(0, DISPLAY_LIMIT);
  const loaded = !loading;

  // No desktop, "doações" é uma tela embutida no master-detail do
  // Administrativo (/settings), não uma rota própria — ?open=donations avisa
  // o hub pra abrir direto o detalhe. No mobile não existe esse master-detail,
  // então navega pra rota standalone normalmente (mesmo destino do menu).
  function openDonations() {
    router.push(isDesktop ? "/settings?open=donations" : "/donations");
  }

  return (
    <CoachTarget id="recent-donations-card">
      <div className={styles.container}>
        <button
          type="button"
          className={styles.header}
          onClick={openDonations}
          aria-label="Ver todas as doações"
        >
          <span className={styles.headerTitle}>Doações do mês</span>
          <ChevronRight size={16} color="var(--color-text-muted)" />
        </button>

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
