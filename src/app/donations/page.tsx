"use client";

import { Header } from "@/components/Header";
import { ToastMessage } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { DonationServices } from "@/services/DonationService";
import { TRANSACTION_STATUS, isReturnedTransaction } from "@/types/Charge";
import { IDonation } from "@/types/Donation";
import { formatMoneyBRL } from "@/utils/helper";
import { Banknote, ChevronLeft, ChevronRight, Gift, Loader2, QrCode } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./donations.module.css";

// Portado de resgatar_app/src/screens/DonationsScreen.

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

function sumAmounts(donations: IDonation[]): number {
  const cents = donations.reduce((acc, d) => {
    const normalized = d.amount.replace(/\./g, "").replace(",", ".");
    const value = parseFloat(normalized);
    return acc + (isNaN(value) ? 0 : Math.round(value * 100));
  }, 0);
  return cents / 100;
}

export function DonationsScreen({ embedded = false }: { embedded?: boolean }) {
  const { colors } = useAppTheme();
  const { isDesktop } = useBreakpoint();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [donations, setDonations] = useState<IDonation[]>([]);
  const [loading, setLoading] = useState(true);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await DonationServices.list(year);
      const valid = data.filter((d) => !isReturnedTransaction(d.status));
      setDonations(valid);
    } catch {
      setDonations([]);
      ToastMessage.error("Erro", "Não foi possível carregar as doações.");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    load();
  }, [load]);

  function goToPreviousMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (isCurrentMonth) return;
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const monthDonations = useMemo(() => donations.filter((d) => d.referenceMonth === month), [donations, month]);

  const approved = useMemo(
    () => monthDonations.filter((d) => d.status === TRANSACTION_STATUS.APPROVED),
    [monthDonations],
  );

  const total = useMemo(() => sumAmounts(approved), [approved]);
  const pixTotal = useMemo(() => sumAmounts(approved.filter((d) => d.paymentMethodId === "pix")), [approved]);
  const cashTotal = useMemo(() => sumAmounts(approved.filter((d) => d.paymentMethodId === "cash")), [approved]);

  if (isDesktop) {
    return (
      <div className={styles.content}>
        <div className={styles.pageHead}>
          <p className="eyebrow">Administrativo</p>
          <h1 className={styles.pageTitle}>Listagem de doações</h1>
        </div>

        {loading ? (
          <div className={styles.centered}>
            <Loader2 size={28} color={colors.primary} className="spin" />
          </div>
        ) : (
          <div className={styles.desktopList}>
            <div className="monthnav">
              <button type="button" className="nav-arrow" onClick={goToPreviousMonth} aria-label="Mês anterior">
                <ChevronLeft size={18} />
              </button>
              <span className="mn-lbl">
                {MONTH_LABELS[month]} {year}
              </span>
              <button
                type="button"
                className="nav-arrow"
                onClick={goToNextMonth}
                disabled={isCurrentMonth}
                aria-label="Próximo mês"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="card card-pad">
              <span className="cap">Total de doações no mês</span>
              <div className="money" style={{ fontSize: 34, margin: "8px 0 4px" }}>
                {formatMoneyBRL(total)}
              </div>
              <div style={{ color: "var(--ink-3)", fontSize: 13, marginBottom: 18 }}>
                {approved.length} {approved.length === 1 ? "doação confirmada" : "doações confirmadas"}
              </div>
              <hr className="hairline" style={{ margin: "0 0 14px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-2)" }}>
                  <QrCode size={17} />
                  PIX
                </span>
                <b className="money">{formatMoneyBRL(pixTotal)}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-2)" }}>
                  <Banknote size={17} />
                  Dinheiro
                </span>
                <b className="money">{formatMoneyBRL(cashTotal)}</b>
              </div>
            </div>

            <div className="card">
              {monthDonations.length === 0 ? (
                <div className="empty">
                  <div className="e-ic">
                    <Gift size={28} />
                  </div>
                  <p>Nenhuma doação registrada neste mês.</p>
                </div>
              ) : (
                monthDonations.map((item) => {
                  const isPix = item.paymentMethodId === "pix";
                  const isApproved = item.status === TRANSACTION_STATUS.APPROVED;
                  return (
                    <div key={item.transactionId} className="lrow">
                      <div className="la">{isPix ? <QrCode size={18} /> : <Banknote size={18} />}</div>
                      <div className="lt">
                        <b>{item.donorName?.trim() || "Anônimo"}</b>
                        <small>{isPix ? "PIX" : "Dinheiro"}</small>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                        <span className="money">{formatMoneyBRL(item.amount)}</span>
                        {!isApproved && (
                          <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
                            {item.status === TRANSACTION_STATUS.PENDING ? "Pendente" : "Não confirmada"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.content}>
      {!embedded && <p className={styles.screenTitle}>Listagem de doações</p>}

      {loading ? (
          <div className={styles.centered}>
            <Loader2 size={28} color={colors.primary} className="spin" />
          </div>
        ) : (
          <div className={styles.list}>
            <div className={styles.yearSelector}>
              <button type="button" className={styles.navButton} onClick={goToPreviousMonth} aria-label="Mês anterior">
                <ChevronLeft size={22} color={colors.primary} />
              </button>
              <p className={styles.yearLabel}>
                {MONTH_LABELS[month]} {year}
              </p>
              <button
                type="button"
                className={[styles.navButton, isCurrentMonth && styles.navButtonDisabled].filter(Boolean).join(" ")}
                onClick={goToNextMonth}
                disabled={isCurrentMonth}
                aria-label="Próximo mês"
              >
                <ChevronRight size={22} color={colors.primary} />
              </button>
            </div>

            <div className={styles.card}>
              <p className={styles.metaLabel}>Total de doações no mês</p>
              <p className={styles.totalValue}>{formatMoneyBRL(total)}</p>
              <p className={styles.metaLabel}>
                {approved.length} {approved.length === 1 ? "doação confirmada" : "doações confirmadas"}
              </p>

              <div className={styles.breakdown}>
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownLabelRow}>
                    <QrCode size={14} color={colors.info} />
                    <span className={styles.breakdownLabel}>PIX</span>
                  </span>
                  <span className={styles.breakdownValue}>{formatMoneyBRL(pixTotal)}</span>
                </div>
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownLabelRow}>
                    <Banknote size={14} color={colors.success} />
                    <span className={styles.breakdownLabel}>Dinheiro</span>
                  </span>
                  <span className={styles.breakdownValue}>{formatMoneyBRL(cashTotal)}</span>
                </div>
              </div>
            </div>

            {monthDonations.length === 0 ? (
              <div className={styles.centered}>
                <Gift size={32} color={colors.textMuted} />
                <p className={styles.emptyText}>Nenhuma doação registrada neste mês.</p>
              </div>
            ) : (
              monthDonations.map((item) => {
                const isPix = item.paymentMethodId === "pix";
                const isApproved = item.status === TRANSACTION_STATUS.APPROVED;
                return (
                  <div key={item.transactionId} className={styles.donationCard}>
                    <div className={styles.donationRow}>
                      <div className={styles.methodIcon}>
                        {isPix ? <QrCode size={18} color={colors.info} /> : <Banknote size={18} color={colors.success} />}
                      </div>
                      <div className={styles.donationInfo}>
                        <p className={styles.donationName}>{item.donorName?.trim() || "Anônimo"}</p>
                        <p className={styles.donationMeta}>{isPix ? "PIX" : "Dinheiro"}</p>
                      </div>
                      <div className={styles.donationValues}>
                        <span className={styles.donationValue}>{formatMoneyBRL(item.amount)}</span>
                        {!isApproved && (
                          <span className={styles.donationStatus}>
                            {item.status === TRANSACTION_STATUS.PENDING ? "Pendente" : "Não confirmada"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
    </div>
  );
}

export default function DonationsPage() {
  const { member } = useAuth();
  const router = useRouter();

  return (
    <div className={`app-shell app-shell--wide ${styles.container}`}>
      <Header
        name={`${member?.firstName ?? ""} ${member?.lastName ?? ""}`}
        photo={member?.profileImage}
        onBack={() => router.back()}
      />
      <DonationsScreen />
    </div>
  );
}
