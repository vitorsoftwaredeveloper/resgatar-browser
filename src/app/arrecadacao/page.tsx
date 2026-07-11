"use client";

import { Avatar } from "@/components/Avatar";
import { Header } from "@/components/Header";
import { ToastMessage } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useAdminHubRedirect } from "@/hooks/useAdminHubRedirect";
import { ChargeServices } from "@/services/ChargeService";
import { IChargeSummary, IChargeSummaryMember } from "@/types/Charge";
import { formatDateFromTimestamp, formatMoneyBRL } from "@/utils/helper";
import { Banknote, ChevronLeft, ChevronRight, CircleAlert, CircleCheck, Loader2, QrCode, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./arrecadacao.module.css";

// Portado de resgatar_app/src/screens/ArrecadacaoScreen. Estilo único (editorial
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

type Tab = "paid" | "pending";

export function ArrecadacaoScreen({ embedded = false }: { embedded?: boolean }) {
  const { colors } = useAppTheme();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [tab, setTab] = useState<Tab>("paid");
  const [summary, setSummary] = useState<IChargeSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ChargeServices.getSummary(year, month + 1);
      setSummary(data);
    } catch {
      setSummary(null);
      ToastMessage.error("Erro", "Não foi possível carregar a arrecadação.");
    } finally {
      setLoading(false);
    }
  }, [year, month]);

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

  const progress = useMemo(() => {
    if (!summary || summary.goal <= 0) return 0;
    return Math.min(summary.collected / summary.goal, 1);
  }, [summary]);

  const members = useMemo(() => {
    if (!summary) return [];
    return summary.members.filter((m) => (tab === "paid" ? m.paid : !m.paid));
  }, [summary, tab]);

  function renderMember(item: IChargeSummaryMember) {
    const methodLabel = item.method === "cash" ? "Dinheiro" : "PIX";
    return (
      <div key={item.id} className="lrow">
        <Avatar photo={item.photo} size={44} />
        <div className="lt">
          <b>{item.name}</b>
          <small>
            {item.paid
              ? `Pago em ${formatDateFromTimestamp(item.paidAt ? new Date(item.paidAt).getTime() : undefined)} · ${methodLabel}`
              : "Pagamento pendente"}
          </small>
        </div>
        <span className="money">{formatMoneyBRL(item.amount)}</span>
      </div>
    );
  }

  return (
    <div className={styles.content}>
      <div className={styles.pageHead}>
        {!embedded && <p className="eyebrow">Administrativo</p>}
        <h1 className={styles.pageTitle}>Entrada mensal</h1>
      </div>

      {loading ? (
        <div className={styles.centered}>
          <Loader2 size={28} color={colors.primary} className="spin" />
        </div>
      ) : !summary ? (
        <div className={styles.centered}>
          <p className={styles.emptyText}>Não foi possível carregar a arrecadação.</p>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="cap">Meta do mês</span>
              <span className="money" style={{ fontSize: 22, color: "var(--ok)" }}>
                {Math.round(progress * 100)}%
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, margin: "8px 0 14px" }}>
              <span className="money" style={{ fontSize: 34 }}>
                {formatMoneyBRL(summary.collected)}
              </span>
              <span style={{ color: "var(--ink-3)", fontWeight: 600 }}>/ {formatMoneyBRL(summary.goal)}</span>
            </div>
            <div className="bar">
              <i style={{ width: `${progress * 100}%` }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, color: "var(--ink-2)", fontSize: 14 }}>
              {summary.goal <= 0 ? (
                <>
                  <Target size={17} color={colors.textMuted} />
                  <span>Nenhuma contribuição prevista neste mês.</span>
                </>
              ) : summary.remaining > 0 ? (
                <>
                  <Target size={17} style={{ color: "var(--gold)" }} />
                  Falta <b style={{ color: "var(--ink)" }}>{formatMoneyBRL(summary.remaining)}</b>&nbsp;para a meta
                </>
              ) : (
                <>
                  <CircleCheck size={17} style={{ color: "var(--ok)" }} />
                  <span>Meta atingida!</span>
                </>
              )}
            </div>
          </div>

          <div className={styles.kpiGrid}>
            <div className="tile">
              <div className="t-top">
                <span className="t-ic">
                  <QrCode size={16} />
                </span>
                PIX
              </div>
              <div className="t-val money">{formatMoneyBRL(summary.byMethod.pix)}</div>
            </div>
            <div className="tile">
              <div className="t-top">
                <span className="t-ic">
                  <Banknote size={16} />
                </span>
                Dinheiro
              </div>
              <div className="t-val money">{formatMoneyBRL(summary.byMethod.cash)}</div>
            </div>
            <div className="tile">
              <div className="t-top">
                <span className="t-ic" style={{ background: "var(--ok-soft)", color: "var(--ok)" }}>
                  <CircleCheck size={16} />
                </span>
                Pagaram
              </div>
              <div className="t-val">
                {summary.counts.paid} <span style={{ fontSize: 16, color: "var(--ink-3)" }}>de {summary.counts.total}</span>
              </div>
            </div>
            <div className="tile">
              <div className="t-top">
                <span className="t-ic" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
                  <CircleAlert size={16} />
                </span>
                Inadimplentes
              </div>
              <div className="t-val money">{summary.counts.pending}</div>
            </div>
          </div>

          <div className="tabs">
            <button type="button" className={tab === "paid" ? "on" : ""} onClick={() => setTab("paid")}>
              Pagaram ({summary.counts.paid})
            </button>
            <button type="button" className={tab === "pending" ? "on" : ""} onClick={() => setTab("pending")}>
              Inadimplentes ({summary.counts.pending})
            </button>
          </div>

          <div className="card">
            {members.length === 0 ? (
              <div className="empty">
                <div className="e-ic">
                  <CircleCheck size={28} />
                </div>
                <p>{tab === "paid" ? "Ninguém pagou ainda neste mês." : "Nenhum inadimplente neste mês."}</p>
              </div>
            ) : (
              members.map(renderMember)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ArrecadacaoPage() {
  const { member } = useAuth();
  const router = useRouter();
  // No desktop esta tela vive inline no hub /settings — a rota standalone
  // redireciona pra lá.
  if (useAdminHubRedirect("arrecadacao")) return null;

  return (
    <div className={`app-shell app-shell--wide ${styles.container}`}>
      <Header
        name={`${member?.firstName ?? ""} ${member?.lastName ?? ""}`}
        photo={member?.profileImage}
        onBack={() => router.back()}
        crumbs={[
          { label: "Administrativo", onClick: () => router.push("/settings") },
          { label: "Entrada mensal" },
        ]}
      />
      <ArrecadacaoScreen />
    </div>
  );
}
