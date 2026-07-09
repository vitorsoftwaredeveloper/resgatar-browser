"use client";

import { Avatar } from "@/components/Avatar";
import { Header } from "@/components/Header";
import { ToastMessage } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useBreakpoint } from "@/hooks/useBreakpoint";
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

// Portado de resgatar_app/src/screens/BalancoAnualScreen.

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
  const { isDesktop } = useBreakpoint();
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
      <div key={`m-${item.month}`} className={styles.card}>
        <div className={styles.monthCardHeader}>
          <span className={styles.monthName}>{MONTH_LABELS[item.month - 1]}</span>
          <span className={styles.metaPercent}>{Math.round(item.percent)}%</span>
        </div>
        <div className={styles.monthValueRow}>
          <span className={styles.monthCollected}>{formatMoneyBRL(item.collected)}</span>
          <span className={styles.monthGoal}>/ {formatMoneyBRL(item.goal)}</span>
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${monthProgress * 100}%` }} />
        </div>
        <div className={styles.monthSplitRow}>
          <span className={styles.monthSplitItem}>
            <QrCode size={13} color={colors.info} />
            <span className={styles.monthSplitText}>{formatMoneyBRL(item.byMethod.pix)}</span>
          </span>
          <span className={styles.monthSplitItem}>
            <Banknote size={13} color={colors.success} />
            <span className={styles.monthSplitText}>{formatMoneyBRL(item.byMethod.cash)}</span>
          </span>
          <span className={styles.monthSplitItem}>
            <CircleCheck size={13} color={colors.success} />
            <span className={styles.monthSplitText}>
              {item.counts.paid}/{item.counts.total} pagaram
            </span>
          </span>
        </div>
        {mb && (
          <div className={styles.monthBalanceRow}>
            {mb.doacoes > 0 && (
              <span className={styles.monthBalanceItem}>
                <Gift size={13} color={colors.info} />
                <span className={styles.monthBalanceLabel}>Doações</span>
                <span className={styles.monthSplitText}>{formatMoneyBRL(mb.doacoes)}</span>
              </span>
            )}
            <span className={styles.monthBalanceItem}>
              <ArrowUpCircle size={13} color={colors.error} />
              <span className={styles.monthBalanceLabel}>Saídas</span>
              <span className={styles.monthOut}>{formatMoneyBRL(mb.saidas)}</span>
            </span>
            <span className={styles.monthBalanceItem}>
              <span className={styles.monthBalanceLabel}>Resultado</span>
              <span className={styles.monthNet} style={{ color: mb.resultado >= 0 ? colors.success : colors.error }}>
                {mb.resultado >= 0 ? "+" : "−"}
                {formatMoneyBRL(Math.abs(mb.resultado))}
              </span>
            </span>
          </div>
        )}
      </div>
    );
  }

  function renderMember(item: IAnnualByMember) {
    const metaParts = [`${item.monthsPaid} mês(es) pago(s)`];
    if (item.monthsPending > 0) metaParts.push(`${item.monthsPending} pendente(s)`);
    return (
      <div key={item.id} className={styles.memberCard}>
        <Avatar photo={item.photo} size={40} />
        <div className={styles.memberInfo}>
          <p className={styles.memberName}>{item.name}</p>
          <p className={styles.memberMeta}>{metaParts.join(" · ")}</p>
        </div>
        <div className={styles.memberValues}>
          <span className={styles.memberValue}>{formatMoneyBRL(item.totalPaid)}</span>
          {item.totalDue > 0 && <span className={styles.memberDue}>deve {formatMoneyBRL(item.totalDue)}</span>}
        </div>
      </div>
    );
  }

  function renderDesktopMonth(item: IAnnualByMonth) {
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

  function renderDesktopMember(item: IAnnualByMember) {
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

  if (isDesktop) {
    return (
      <div className={styles.content}>
        <div className={styles.pageHead}>
          <p className="eyebrow">Administrativo</p>
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
                <span className="serif" style={{ fontSize: 22, color: "var(--ok)" }}>
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
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}>
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

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
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
                {(listData as IAnnualByMonth[]).map(renderDesktopMonth)}
              </div>
            ) : (
              <div className="card">{(listData as IAnnualByMember[]).map(renderDesktopMember)}</div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.content}>
      {!embedded && <p className={styles.screenTitle}>Balanço anual</p>}

      {loading ? (
          <div className={styles.centered}>
            <Loader2 size={28} color={colors.primary} className="spin" />
          </div>
        ) : !summary ? (
          <div className={styles.centered}>
            <p className={styles.emptyText}>Não foi possível carregar o balanço anual.</p>
          </div>
        ) : (
          <div className={styles.list}>
            <div className={styles.yearSelector}>
              <button type="button" className={styles.navButton} onClick={() => setYear((y) => y - 1)} aria-label="Ano anterior">
                <ChevronLeft size={22} color={colors.primary} />
              </button>
              <p className={styles.yearLabel}>{year}</p>
              <button
                type="button"
                className={[styles.navButton, isCurrentYear && styles.navButtonDisabled].filter(Boolean).join(" ")}
                onClick={() => !isCurrentYear && setYear((y) => y + 1)}
                disabled={isCurrentYear}
                aria-label="Próximo ano"
              >
                <ChevronRight size={22} color={colors.primary} />
              </button>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeaderRow}>
                <span className={styles.metaLabel}>{cutoffLabel}</span>
                <span className={styles.metaPercent}>{Math.round(progress * 100)}%</span>
              </div>
              <div className={styles.metaValueRow}>
                <span className={styles.metaCollected}>{formatMoneyBRL(summary.totals.collected)}</span>
                <span className={styles.metaGoal}>/ {formatMoneyBRL(summary.totals.goal)}</span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
              </div>
              <div className={styles.remainingRow}>
                {summary.totals.goal <= 0 ? (
                  <>
                    <Target size={16} color={colors.textMuted} />
                    <span className={styles.metaLabel}>Nenhuma contribuição registrada neste ano.</span>
                  </>
                ) : summary.totals.remaining > 0 ? (
                  <>
                    <Target size={16} color={colors.primary} />
                    <span className={styles.remainingText}>
                      Falta <span className={styles.remainingStrong}>{formatMoneyBRL(summary.totals.remaining)}</span> para a
                      meta do ano
                    </span>
                  </>
                ) : (
                  <>
                    <CircleCheck size={16} color={colors.success} />
                    <span className={styles.goalReachedText}>Meta do ano atingida!</span>
                  </>
                )}
              </div>
            </div>

            {balance && (
              <div className={styles.card}>
                <p className={styles.balanceTitle}>Balanço do ano</p>
                <div className={styles.balanceRow}>
                  <div className={styles.balanceItem}>
                    <span className={styles.balanceItemHeader}>
                      <Wallet size={14} color={colors.success} />
                      <span className={styles.balanceItemLabel}>Entradas</span>
                    </span>
                    <span className={styles.balanceValueIn}>{formatMoneyBRL(balance.totals.entradas)}</span>
                  </div>
                  <div className={styles.balanceDivider} />
                  <div className={styles.balanceItem}>
                    <span className={styles.balanceItemHeader}>
                      <Gift size={14} color={colors.info} />
                      <span className={styles.balanceItemLabel}>Doações</span>
                    </span>
                    <span className={styles.balanceValueIn}>{formatMoneyBRL(balance.totals.doacoes)}</span>
                  </div>
                  <div className={styles.balanceDivider} />
                  <div className={styles.balanceItem}>
                    <span className={styles.balanceItemHeader}>
                      <ArrowUpCircle size={14} color={colors.error} />
                      <span className={styles.balanceItemLabel}>Saídas</span>
                    </span>
                    <span className={styles.balanceValueOut}>{formatMoneyBRL(balance.totals.saidas)}</span>
                  </div>
                  <div className={styles.balanceDivider} />
                  <div className={styles.balanceItem}>
                    <span className={styles.balanceItemHeader}>
                      <Wallet size={14} color={colors.primary} />
                      <span className={styles.balanceItemLabel}>Saldo</span>
                    </span>
                    <span
                      className={styles.balanceValueNet}
                      style={{ color: balance.totals.saldoFinal >= 0 ? colors.success : colors.error }}
                    >
                      {formatMoneyBRL(balance.totals.saldoFinal)}
                    </span>
                  </div>
                </div>
                <p className={styles.balanceHint}>
                  {isCurrentYear ? "Entradas − saídas, acumulado até o mês atual." : "Entradas − saídas do ano fechado."}
                </p>

                <div className={styles.exportRow}>
                  <button
                    type="button"
                    className={styles.exportButton}
                    onClick={handleExport}
                    disabled={exporting || exportingExcel}
                    aria-label="Exportar balanço em PDF"
                  >
                    {exporting ? <Loader2 size={16} color={colors.primary} className="spin" /> : <FileDown size={16} color={colors.primary} />}
                    {exporting ? "Gerando PDF…" : "PDF"}
                  </button>

                  <button
                    type="button"
                    className={styles.exportButton}
                    onClick={handleExportExcel}
                    disabled={exporting || exportingExcel}
                    aria-label="Exportar balanço em Excel"
                  >
                    {exportingExcel ? (
                      <Loader2 size={16} color={colors.primary} className="spin" />
                    ) : (
                      <FileSpreadsheet size={16} color={colors.primary} />
                    )}
                    {exportingExcel ? "Gerando Excel…" : "Excel"}
                  </button>
                </div>
              </div>
            )}

            <div className={styles.metricGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <QrCode size={16} color={colors.info} />
                  <span className={styles.metricLabel}>PIX</span>
                </div>
                <p className={styles.metricValue}>{formatMoneyBRL(summary.totals.byMethod.pix)}</p>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <Banknote size={16} color={colors.success} />
                  <span className={styles.metricLabel}>Dinheiro</span>
                </div>
                <p className={styles.metricValue}>{formatMoneyBRL(summary.totals.byMethod.cash)}</p>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <CircleCheck size={16} color={colors.success} />
                  <span className={styles.metricLabel}>Pagamentos</span>
                </div>
                <p className={styles.metricValue}>{summary.totals.counts.paid}</p>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <CircleAlert size={16} color={colors.error} />
                  <span className={styles.metricLabel}>Pendências</span>
                </div>
                <p className={styles.metricValue}>{summary.totals.counts.pending}</p>
              </div>
            </div>

            <div className={styles.tabBar}>
              <button
                type="button"
                className={[styles.tab, tab === "months" && styles.tabActive].filter(Boolean).join(" ")}
                onClick={() => setTab("months")}
              >
                Por mês
              </button>
              <button
                type="button"
                className={[styles.tab, tab === "members" && styles.tabActive].filter(Boolean).join(" ")}
                onClick={() => setTab("members")}
              >
                Membros ({summary.byMember.length})
              </button>
            </div>

            {listData.length === 0 ? (
              <div className={styles.centered}>
                <p className={styles.emptyText}>
                  {tab === "months" ? "Nenhum mês com arrecadação neste ano." : "Nenhum membro com contribuição neste ano."}
                </p>
              </div>
            ) : tab === "months" ? (
              (listData as IAnnualByMonth[]).map(renderMonth)
            ) : (
              (listData as IAnnualByMember[]).map(renderMember)
            )}
          </div>
        )}
    </div>
  );
}

export default function BalancoAnualPage() {
  const { member } = useAuth();
  const router = useRouter();

  return (
    <div className={`app-shell app-shell--wide ${styles.container}`}>
      <Header
        name={`${member?.firstName ?? ""} ${member?.lastName ?? ""}`}
        photo={member?.profileImage}
        onBack={() => router.back()}
      />
      <BalancoAnualScreen />
    </div>
  );
}
