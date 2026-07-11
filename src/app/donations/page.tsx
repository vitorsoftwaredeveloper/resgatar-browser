"use client";

import { Header } from "@/components/Header";
import { ToastMessage } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useAdminHubRedirect } from "@/hooks/useAdminHubRedirect";
import { DonationServices } from "@/services/DonationService";
import { TRANSACTION_STATUS, isReturnedTransaction } from "@/types/Charge";
import { IDonation } from "@/types/Donation";
import { formatMoneyBRL } from "@/utils/helper";
import { Banknote, ChevronLeft, ChevronRight, Gift, Loader2, QrCode } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./donations.module.css";

// Portado de resgatar_app/src/screens/DonationsScreen. Estilo único (editorial
// "Missal") em mobile e desktop — o layout é mobile-first e reflow via @media.

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
  const { member } = useAuth();
  const isAdmin = member?.role === "admin";

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

  return (
    <div className={styles.content}>
      <div className={styles.pageHead}>
        {!embedded && isAdmin && <p className="eyebrow">Administrativo</p>}
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

export default function DonationsPage() {
  const { member } = useAuth();
  const router = useRouter();
  // No desktop esta tela vive inline no hub /settings — redireciona pra lá.
  if (useAdminHubRedirect("donations")) return null;

  return (
    <div className={`app-shell app-shell--wide ${styles.container}`}>
      <Header
        name={`${member?.firstName ?? ""} ${member?.lastName ?? ""}`}
        photo={member?.profileImage}
        onBack={() => router.back()}
        crumbs={[
          { label: "Administrativo", onClick: () => router.push("/settings") },
          { label: "Listagem de doações" },
        ]}
      />
      <DonationsScreen />
    </div>
  );
}
