"use client";

import { Dialog } from "@/components/Dialog";
import { Header } from "@/components/Header";
import { ModalExpenseForm } from "@/components/ModalExpenseForm";
import { ToastMessage } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useAdminHubRedirect } from "@/hooks/useAdminHubRedirect";
import { ExpenseServices } from "@/services/ExpenseService";
import { EXPENSE_CATEGORY_LABELS, ExpenseCategory, IExpense, IExpensesSummary } from "@/types/Expense";
import { formatDateFromTimestamp, formatMoneyBRL } from "@/utils/helper";
import { ChevronLeft, ChevronRight, Loader2, Pencil, Plus, Receipt, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import styles from "./expenses.module.css";

// Portado de resgatar_app/src/screens/ExpensesScreen. Estilo único (editorial
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

export function ExpensesScreen({ embedded = false }: { embedded?: boolean }) {
  const { colors } = useAppTheme();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [summary, setSummary] = useState<IExpensesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<IExpense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IExpense | null>(null);
  const [loadingReceiptId, setLoadingReceiptId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleExpanded(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ExpenseServices.getSummary(year, month);
      setSummary(data);
    } catch {
      setSummary(null);
      ToastMessage.error("Erro", "Não foi possível carregar as despesas.");
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

  function openCreate() {
    setEditing(null);
    setModalVisible(true);
  }

  function openEdit(expense: IExpense) {
    setEditing(expense);
    setModalVisible(true);
  }

  async function handleViewReceipt(expense: IExpense) {
    if (loadingReceiptId) return;
    setLoadingReceiptId(expense._id);
    try {
      const url = await ExpenseServices.getReceiptViewUrl(expense._id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      ToastMessage.error("Erro", "Não foi possível abrir o comprovante.");
    } finally {
      setLoadingReceiptId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await ExpenseServices.remove(deleteTarget._id);
      ToastMessage.success("Despesa removida");
      load();
    } catch {
      ToastMessage.error("Erro", "Não foi possível remover.");
    } finally {
      setDeleteTarget(null);
    }
  }

  const categoryEntries = summary ? Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1]) : [];
  const sortedExpenses = summary ? [...summary.expenses].sort((a, b) => b.date - a.date) : [];

  return (
    <>
      <div className={styles.content}>
        <div className={styles.pageHead}>
          {!embedded && <p className="eyebrow">Administrativo</p>}
          <h1 className={styles.pageTitle}>Despesa mensal</h1>
        </div>

        {loading ? (
          <div className={styles.centered}>
            <Loader2 size={28} color={colors.primary} className="spin" />
          </div>
        ) : !summary ? (
          <div className={styles.centered}>
            <p className={styles.emptyText}>Não foi possível carregar as despesas.</p>
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
              <span className="cap">Total de despesas no mês</span>
              <div className="money" style={{ fontSize: 34, margin: "8px 0 4px", color: "var(--danger)" }}>
                {formatMoneyBRL(summary.total)}
              </div>
              <div style={{ color: "var(--ink-3)", fontSize: 13, marginBottom: categoryEntries.length > 0 ? 18 : 0 }}>
                {summary.count} {summary.count === 1 ? "lançamento" : "lançamentos"}
              </div>
              {categoryEntries.length > 0 && (
                <>
                  <hr className="hairline" style={{ margin: "0 0 12px" }} />
                  {categoryEntries.map(([cat, value]) => (
                    <div key={cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                      <span style={{ fontWeight: 600 }}>{EXPENSE_CATEGORY_LABELS[cat as ExpenseCategory] ?? cat}</span>
                      <b className="money">{formatMoneyBRL(value)}</b>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="card">
              {sortedExpenses.length === 0 ? (
                <div className="empty">
                  <div className="e-ic">
                    <Receipt size={28} />
                  </div>
                  <p>Nenhuma despesa lançada neste mês.</p>
                </div>
              ) : (
                sortedExpenses.map((item) => {
                  const isExpanded = expandedId === item._id;
                  const categoryLabel = EXPENSE_CATEGORY_LABELS[item.category] ?? item.category;

                  return (
                    <div
                      key={item._id}
                      className={`lrow ${styles.expenseRow}`}
                      style={{ flexWrap: "wrap", cursor: "pointer" }}
                      onClick={() => toggleExpanded(item._id)}
                    >
                      <div className="la" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
                        <Receipt size={20} />
                      </div>
                      <div className="lt">
                        <b>{item.description}</b>
                        <small>
                          {categoryLabel} · {formatDateFromTimestamp(item.date)}
                        </small>
                      </div>
                      <b className="money">{formatMoneyBRL(item.amount)}</b>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className="icon-btn"
                          style={{ width: 36, height: 36 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(item);
                          }}
                          aria-label="Editar despesa"
                        >
                          <Pencil size={16} />
                        </button>
                        {item.receiptKey && (
                          <button
                            type="button"
                            className="icon-btn"
                            style={{ width: 36, height: 36 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (loadingReceiptId !== item._id) handleViewReceipt(item);
                            }}
                            aria-label="Ver comprovante"
                          >
                            {loadingReceiptId === item._id ? <Loader2 size={16} className="spin" /> : <Receipt size={16} />}
                          </button>
                        )}
                        <button
                          type="button"
                          className="icon-btn"
                          style={{ width: 36, height: 36, color: "var(--danger)" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(item);
                          }}
                          aria-label="Remover item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {isExpanded && (
                        <div className={styles.expenseDetails} style={{ flexBasis: "100%" }}>
                          <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Categoria</span>
                            <span className={styles.detailValue}>{categoryLabel}</span>
                          </div>
                          <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Data</span>
                            <span className={styles.detailValue}>{formatDateFromTimestamp(item.date)}</span>
                          </div>
                          <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Valor</span>
                            <span className={styles.detailValue}>{formatMoneyBRL(item.amount)}</span>
                          </div>
                          <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Referência</span>
                            <span className={styles.detailValue}>
                              {MONTH_LABELS[item.referenceMonth]} {item.referenceYear}
                            </span>
                          </div>
                          <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Observação</span>
                            <span className={styles.detailValue}>{item.note || "—"}</span>
                          </div>
                          <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Comprovante</span>
                            <span className={styles.detailValue}>{item.receiptKey ? "Anexado" : "Nenhum"}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        <button type="button" className={styles.fab} onClick={openCreate} aria-label="Nova despesa">
          <Plus size={28} color={colors.white} strokeWidth={2.5} />
        </button>
      </div>

      {modalVisible && (
        <ModalExpenseForm
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSaved={load}
          referenceMonth={month}
          referenceYear={year}
          expense={editing}
        />
      )}

      <Dialog
        visible={Boolean(deleteTarget)}
        title="Remover despesa"
        description={deleteTarget ? `Deseja remover "${deleteTarget.description}"? Essa ação não pode ser desfeita.` : ""}
        onClose={() => setDeleteTarget(null)}
        actions={[
          { label: "cancelar", onPress: () => setDeleteTarget(null), variant: "secondary" },
          { label: "remover", onPress: handleDelete, variant: "primary" },
        ]}
      />
    </>
  );
}

export default function ExpensesPage() {
  const { member } = useAuth();
  const router = useRouter();
  // No desktop esta tela vive inline no hub /settings — redireciona pra lá.
  if (useAdminHubRedirect("expenses")) return null;

  return (
    <div className={`app-shell app-shell--wide ${styles.container}`}>
      <Header
        name={`${member?.firstName ?? ""} ${member?.lastName ?? ""}`}
        photo={member?.profileImage}
        onBack={() => router.back()}
        crumbs={[
          { label: "Administrativo", onClick: () => router.push("/settings") },
          { label: "Despesa mensal" },
        ]}
      />
      <ExpensesScreen />
    </div>
  );
}
