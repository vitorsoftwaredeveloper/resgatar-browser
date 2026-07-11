"use client";

import { Avatar } from "@/components/Avatar";
import { Header } from "@/components/Header";
import { ToastMessage } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useAdminHubRedirect } from "@/hooks/useAdminHubRedirect";
import { BalanceServices } from "@/services/BalanceService";
import { ChargeServices } from "@/services/ChargeService";
import { IAnnualBalance, IAnnualBalanceMonth } from "@/types/Balance";
import { IAnnualByMember, IAnnualByMonth, IAnnualSummary } from "@/types/Charge";
import { shareBalanceReportExcel, shareBalanceReportPDF } from "@/utils/generateBalanceReport";
import { formatMoneyBRL } from "@/utils/helper";
import {
  ArrowUpCircle,
  Banknote,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  FileDown,
  FileSpreadsheet,
  Gift,
  Loader2,
  QrCode,
  Target,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./balanco-anual.module.css";

// Portado de resgatar_app/src/screens/BalancoAnualScreen. Estilo único (editorial
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

type Tab = "months" | "members";

export function BalancoAnualScreen({ embedded = false }: { embedded?: boolean }) {
  const { colors, mode } = useAppTheme();
  const [exporting, setExporting] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [tab, setTab] = useState<Tab>("months");
  const [summary, setSummary] = useState<IAnnualSummary | null>(null);
  const [balance, setBalance] = useState<IAnnualBalance | null>(null);
  const [loading, setLoading] = useState(true);

  const isCurrentYear = year === currentYear;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryData, balanceData] = await Promise.all([
        ChargeServices.getAnnualSummary(year),
        BalanceServices.getAnnual(year),
      ]);
      setSummary(summaryData);
      setBalance(balanceData);
    } catch {
      setSummary(null);
      setBalance(null);
      ToastMessage.error("Erro", "Não foi possível carregar o balanço anual.");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    load();
  }, [load]);

  const progress = useMemo(() => {
    if (!summary || summary.totals.goal <= 0) return 0;
    return Math.min(summary.totals.collected / summary.totals.goal, 1);
  }, [summary]);

  const balanceByMonth = useMemo(
    () => new Map<number, IAnnualBalanceMonth>((balance?.byMonth ?? []).map((m) => [m.month, m])),
    [balance],
  );

  const handleExport = useCallback(async () => {
    if (!balance || exporting) return;
    setExporting(true);
    try {
      await shareBalanceReportPDF({ balance, isCurrentYear, themeMode: mode });
    } catch {
      ToastMessage.error("Erro", "Não foi possível gerar o PDF do balanço.");
    } finally {
      setExporting(false);
    }
  }, [balance, exporting, isCurrentYear, mode]);

  const handleExportExcel = useCallback(async () => {
    if (!balance || exportingExcel) return;
    setExportingExcel(true);
    try {
      await shareBalanceReportExcel({ balance, isCurrentYear });
    } catch {
      ToastMessage.error("Erro", "Não foi possível gerar o Excel do balanço.");
    } finally {
      setExportingExcel(false);
    }
  }, [balance, exportingExcel, isCurrentYear]);

  const cutoffLabel = useMemo(() => {
    if (!summary) return "";
    if (!isCurrentYear) return "Ano fechado";
    const lastMonth = MONTH_LABELS[summary.asOfMonth - 1];
    return lastMonth ? `Acumulado até ${lastMonth}` : "Acumulado do ano";
  }, [summary, isCurrentYear]);

  function renderMonth(item: IAnnualByMonth) {
    const monthProgress = item.goal > 0 ? Math.min(item.collected / item.goal, 1) : 0;
    const mb = balanceByMonth.get(item.month);
    return (
      <div key={`m-${item.month}`} className="card card-pad">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <span className="serif" style={{ fontSize: 20 }}>
            {MONTH_LABELS[item.month - 1]}
          </span>
          <span style={{ fontWeight: 700, color: item.percent >= 100 ? "var(--ok)" : "var(--ink-2)" }}>
            {Math.round(item.percent)}%
          </span>
        </div>
        <div style={{ fontSize: 14, color: "var(--ink-2)", marginBottom: 10 }}>
          <b className="money" style={{ color: "var(--ink)", fontSize: 17 }}>
            {formatMoneyBRL(item.collected)}
          </b>{" "}
          / {formatMoneyBRL(item.goal)}
        </div>
        <div className="bar">
          <i style={{ width: `${monthProgress * 100}%` }} />
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 14, fontSize: 13, color: "var(--ink-2)", flexWrap: "wrap" }}>
          <span>
            <QrCode size={14} style={{ verticalAlign: "-2px", color: "var(--ink-3)" }} /> {formatMoneyBRL(item.byMethod.pix)}
          </span>
          <span>
            <Banknote size={14} style={{ verticalAlign: "-2px", color: "var(--ink-3)" }} /> {formatMoneyBRL(item.byMethod.cash)}
          </span>
          <span>
            <CircleCheck size={14} style={{ verticalAlign: "-2px", color: "var(--ok)" }} /> {item.counts.paid}/{item.counts.total}{" "}
            pagaram
          </span>
          {mb && mb.doacoes > 0 && (
            <span>
              <Gift size={14} style={{ verticalAlign: "-2px", color: "var(--ink-3)" }} /> Doações {formatMoneyBRL(mb.doacoes)}
            </span>
          )}
          {mb && (
            <>
              <span style={{ marginLeft: "auto" }}>
                Saídas <b style={{ color: "var(--danger)" }}>{formatMoneyBRL(mb.saidas)}</b>
              </span>
              <span>
                Resultado{" "}
                <b style={{ color: mb.resultado >= 0 ? "var(--ok)" : "var(--danger)" }}>
                  {mb.resultado >= 0 ? "+" : "−"}
                  {formatMoneyBRL(Math.abs(mb.resultado))}
                </b>
              </span>
            </>
          )}
        </div>
      </div>
    );
  }

  function renderMember(item: IAnnualByMember) {
    const metaParts = [`${item.monthsPaid} mês(es) pago(s)`];
    if (item.monthsPending > 0) metaParts.push(`${item.monthsPending} pendente(s)`);
    return (
      <div key={item.id} className="lrow">
        <Avatar photo={item.photo} size={44} />
        <div className="lt">
          <b>{item.name}</b>
          <small>{metaParts.join(" · ")}</small>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
          <span className="money">{formatMoneyBRL(item.totalPaid)}</span>
          {item.totalDue > 0 && (
            <span style={{ fontSize: 12.5, color: "var(--danger)", fontWeight: 600 }}>deve {formatMoneyBRL(item.totalDue)}</span>
          )}
        </div>
      </div>
    );
  }

  const listData: (IAnnualByMonth | IAnnualByMember)[] = summary
    ? tab === "months"
      ? [...summary.byMonth].reverse()
      : summary.byMember
    : [];

  return (
    <div className={styles.content}>
      <div className={styles.pageHead}>
        {!embedded && <p className="eyebrow">Administrativo</p>}
        <h1 className={styles.pageTitle}>Balanço anual</h1>
      </div>

      {loading ? (
        <div className={styles.centered}>
          <Loader2 size={28} color={colors.primary} className="spin" />
        </div>
      ) : !summary ? (
        <div className={styles.centered}>
          <p className={styles.emptyText}>Não foi possível carregar o balanço anual.</p>
        </div>
      ) : (
        <div className={styles.desktopList}>
          <div className="monthnav">
            <button type="button" className="nav-arrow" onClick={() => setYear((y) => y - 1)} aria-label="Ano anterior">
              <ChevronLeft size={18} />
            </button>
            <span className="mn-lbl">{year}</span>
            <button
              type="button"
              className="nav-arrow"
              onClick={() => !isCurrentYear && setYear((y) => y + 1)}
              disabled={isCurrentYear}
              aria-label="Próximo ano"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="card card-pad">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="cap">{cutoffLabel}</span>
              <span className="money" style={{ fontSize: 22, color: "var(--ok)" }}>
                {Math.round(progress * 100)}%
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, margin: "8px 0 14px" }}>
              <span className="money" style={{ fontSize: 34 }}>
                {formatMoneyBRL(summary.totals.collected)}
              </span>
              <span style={{ color: "var(--ink-3)", fontWeight: 600 }}>/ {formatMoneyBRL(summary.totals.goal)}</span>
            </div>
            <div className="bar">
              <i style={{ width: `${progress * 100}%` }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, color: "var(--ink-2)", fontSize: 14 }}>
              {summary.totals.goal <= 0 ? (
                <>
                  <Target size={16} color={colors.textMuted} />
                  <span>Nenhuma contribuição registrada neste ano.</span>
                </>
              ) : summary.totals.remaining > 0 ? (
                <>
                  <Target size={17} style={{ color: "var(--gold)" }} />
                  Falta <b style={{ color: "var(--ink)" }}>{formatMoneyBRL(summary.totals.remaining)}</b>&nbsp;para a meta do ano
                </>
              ) : (
                <>
                  <CircleCheck size={17} style={{ color: "var(--ok)" }} />
                  <span>Meta do ano atingida!</span>
                </>
              )}
            </div>
          </div>

          {balance && (
            <div className="card card-pad">
              <div className="sec-head" style={{ margin: "0 0 16px" }}>
                <h2 style={{ fontSize: 20 }}>Balanço do ano</h2>
              </div>
              <div className={styles.balanceGrid}>
                <div>
                  <div className="t-top" style={{ marginBottom: 8 }}>
                    <span className="t-ic" style={{ background: "var(--ok-soft)", color: "var(--ok)" }}>
                      <Wallet size={16} />
                    </span>
                    Entradas
                  </div>
                  <span className="money" style={{ fontSize: 23 }}>
                    {formatMoneyBRL(balance.totals.entradas)}
                  </span>
                </div>
                <div>
                  <div className="t-top" style={{ marginBottom: 8 }}>
                    <span className="t-ic" style={{ background: "var(--gold-soft)", color: "var(--gold)" }}>
                      <Gift size={16} />
                    </span>
                    Doações
                  </div>
                  <span className="money" style={{ fontSize: 23 }}>
                    {formatMoneyBRL(balance.totals.doacoes)}
                  </span>
                </div>
                <div>
                  <div className="t-top" style={{ marginBottom: 8 }}>
                    <span className="t-ic" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
                      <ArrowUpCircle size={16} />
                    </span>
                    Saídas
                  </div>
                  <span className="money" style={{ fontSize: 23 }}>
                    {formatMoneyBRL(balance.totals.saidas)}
                  </span>
                </div>
                <div>
                  <div className="t-top" style={{ marginBottom: 8 }}>
                    <span className="t-ic">
                      <Banknote size={16} />
                    </span>
                    Saldo
                  </div>
                  <span
                    className="money"
                    style={{ fontSize: 23, color: balance.totals.saldoFinal >= 0 ? "var(--ok)" : "var(--danger)" }}
                  >
                    {formatMoneyBRL(balance.totals.saldoFinal)}
                  </span>
                </div>
              </div>
              <p style={{ color: "var(--ink-3)", fontSize: 12.5, margin: "14px 0 18px" }}>
                {isCurrentYear ? "Entradas − saídas, acumulado até o mês atual." : "Entradas − saídas do ano fechado."}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <button
                  type="button"
                  className="btn btn-soft"
                  onClick={handleExport}
                  disabled={exporting || exportingExcel}
                  aria-label="Exportar balanço em PDF"
                >
                  {exporting ? <Loader2 size={18} className="spin" /> : <FileDown size={18} />}
                  {exporting ? "Gerando PDF…" : "Exportar PDF"}
                </button>
                <button
                  type="button"
                  className="btn btn-soft"
                  onClick={handleExportExcel}
                  disabled={exporting || exportingExcel}
                  aria-label="Exportar balanço em Excel"
                >
                  {exportingExcel ? <Loader2 size={18} className="spin" /> : <FileSpreadsheet size={18} />}
                  {exportingExcel ? "Gerando Excel…" : "Exportar Excel"}
                </button>
              </div>
            </div>
          )}

          <div className={styles.kpiGrid}>
            <div className="tile">
              <div className="t-top">
                <span className="t-ic">
                  <QrCode size={16} />
                </span>
                PIX
              </div>
              <div className="t-val money">{formatMoneyBRL(summary.totals.byMethod.pix)}</div>
            </div>
            <div className="tile">
              <div className="t-top">
                <span className="t-ic">
                  <Banknote size={16} />
                </span>
                Dinheiro
              </div>
              <div className="t-val money">{formatMoneyBRL(summary.totals.byMethod.cash)}</div>
            </div>
            <div className="tile">
              <div className="t-top">
                <span className="t-ic" style={{ background: "var(--ok-soft)", color: "var(--ok)" }}>
                  <CircleCheck size={16} />
                </span>
                Pagamentos
              </div>
              <div className="t-val money">{summary.totals.counts.paid}</div>
            </div>
            <div className="tile">
              <div className="t-top">
                <span className="t-ic" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
                  <CircleAlert size={16} />
                </span>
                Pendências
              </div>
              <div className="t-val money">{summary.totals.counts.pending}</div>
            </div>
          </div>

          <div className="tabs">
            <button type="button" className={tab === "months" ? "on" : ""} onClick={() => setTab("months")}>
              Por mês
            </button>
            <button type="button" className={tab === "members" ? "on" : ""} onClick={() => setTab("members")}>
              Membros ({summary.byMember.length})
            </button>
          </div>

          {listData.length === 0 ? (
            <div className="card">
              <div className="empty">
                <div className="e-ic">
                  <CircleCheck size={28} />
                </div>
                <p>{tab === "months" ? "Nenhum mês com arrecadação neste ano." : "Nenhum membro com contribuição neste ano."}</p>
              </div>
            </div>
          ) : tab === "months" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {(listData as IAnnualByMonth[]).map(renderMonth)}
            </div>
          ) : (
            <div className="card">{(listData as IAnnualByMember[]).map(renderMember)}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BalancoAnualPage() {
  const { member } = useAuth();
  const router = useRouter();
  // No desktop esta tela vive inline no hub /settings — redireciona pra lá.
  if (useAdminHubRedirect("balanco-anual")) return null;

  return (
    <div className={`app-shell app-shell--wide ${styles.container}`}>
      <Header
        name={`${member?.firstName ?? ""} ${member?.lastName ?? ""}`}
        photo={member?.profileImage}
        onBack={() => router.back()}
        crumbs={[
          { label: "Administrativo", onClick: () => router.push("/settings") },
          { label: "Balanço anual" },
        ]}
      />
      <BalancoAnualScreen />
    </div>
  );
}
