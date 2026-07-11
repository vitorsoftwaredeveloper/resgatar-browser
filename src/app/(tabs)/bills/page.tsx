"use client";

import { CoachTarget } from "@/components/CoachTarget";
import { ContributionItem } from "@/components/ContributionItem";
import { Header } from "@/components/Header";
import { ModalComprovante } from "@/components/ModalComprovante";
import { ModalDonate } from "@/components/ModalDonate";
import { PixPaymentModal } from "@/components/PixPaymentModal";
import { ToastMessage } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useCharge } from "@/context/ChargeContext";
import { useAppTheme } from "@/context/ThemeContext";
import { TRANSACTION_STATUS } from "@/types/Charge";
import { IMemberWithContribution } from "@/types/Member";
import { formatDateFromTimestamp, formatMoneyBRL } from "@/utils/helper";
import { AlertTriangle, CheckCircle2, Gift, HandHeart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import styles from "./bills.module.css";

// Portado de resgatar_app/src/screens/BillsScreen. useBottomTabBarHeight não
// tem equivalente aqui — o layout de abas já reserva o espaço do TabBar (ver
// (tabs)/layout.tsx).

const MONTH: Record<string, string> = {
  january: "Janeiro",
  february: "Fevereiro",
  march: "Março",
  april: "Abril",
  may: "Maio",
  june: "Junho",
  july: "Julho",
  august: "Agosto",
  september: "Setembro",
  october: "Outubro",
  november: "Novembro",
  december: "Dezembro",
};

// Ordem jan→dez das chaves em inglês — usada para comparar com
// `Date.getMonth()` (0=janeiro) ao calcular se há mês em atraso.
type ContributionMonthKey =
  keyof IMemberWithContribution["contributions"]["months"];
const MONTH_KEYS_ORDERED = Object.keys(MONTH) as ContributionMonthKey[];

interface ComprovanteData {
  name: string;
  email: string;
  cpf: string;
  docType?: string;
  month: string;
  paidAt: string;
  value: string;
  method?: string;
}

interface Contribution {
  id: string;
  month: string;
  value: string;
  status: string;
  description: string;
  paidAt: string;
  method: string;
}

export default function BillsPage() {
  const { charge, createCharge, consultCharge } = useCharge();
  const { member, reloadMemberData } = useAuth();
  const { colors } = useAppTheme();
  const { isDesktop } = useBreakpoint();
  const [donateModalVisible, setDonateModalVisible] = useState(false);

  const [modalPayVisible, setModalPayVisible] = useState(false);
  const [comprovanteItem, setComprovanteItem] =
    useState<ComprovanteData | null>(null);

  async function handlePay(item: Contribution) {
    try {
      await createCharge(Object.values(MONTH).indexOf(item.month));
      setModalPayVisible(true);
    } catch {
      ToastMessage.error("Erro ao criar cobrança. Tente novamente.");
    }
  }

  // Fallback de confirmação: sem push no web, reconsulta a cobrança pendente
  // ao voltar o foco da aba e em um polling leve — mas só enquanto o modal de
  // pagamento está de fato aberto, para não ficar batendo no backend depois
  // que o usuário já fechou a tela.
  useEffect(() => {
    if (
      !modalPayVisible ||
      charge.status !== TRANSACTION_STATUS.PENDING ||
      !charge.transactionId
    ) {
      return;
    }

    async function refreshPending() {
      try {
        await consultCharge(charge.transactionId);
        await reloadMemberData();
      } catch {
        // Silencioso: é apenas um fallback enquanto aguarda a confirmação.
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible") refreshPending();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    const interval = setInterval(refreshPending, 5000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalPayVisible, charge.status, charge.transactionId]);

  const contributions = useMemo(
    () =>
      Object.entries(member?.contributions.months || {}).map(
        ([month, { paid, value, paidAt, paymentMethod }], index) => {
          const methodLabel = paymentMethod === "cash" ? "Dinheiro" : "PIX";
          return {
            id: `${index}`,
            month: MONTH[month],
            paidAt: `${formatDateFromTimestamp(new Date(paidAt).getTime())}`,
            value: paid
              ? formatMoneyBRL(value)
              : formatMoneyBRL(member?.paymentInfo.amount ?? 0),
            method: methodLabel,
            description: paid
              ? `Pago em ${formatDateFromTimestamp(
                  new Date(paidAt).getTime(),
                )} · ${methodLabel}`
              : "Pagamento a ser realizado",
            status: paid
              ? TRANSACTION_STATUS.APPROVED
              : TRANSACTION_STATUS.PENDING,
          };
        },
      ),
    [member],
  );

  // Resumo do ano para a faixa editorial do desktop — derivado dos mesmos
  // dados brutos de `member.contributions.months` (não da lista já formatada
  // acima), para somar valores numéricos com precisão.
  const summary = useMemo(() => {
    const months = member?.contributions.months;
    if (!months) {
      return {
        paidCount: 0,
        totalMonths: 0,
        totalPaidValue: 0,
        pendingCount: 0,
        pendingValue: 0,
        pct: 0,
        overdue: false,
      };
    }

    const currentMonthIndex = new Date().getMonth();
    const entries = MONTH_KEYS_ORDERED.map((key, index) => ({
      index,
      ...months[key],
    }));
    const paidEntries = entries.filter((e) => e.paid);
    const totalMonths = entries.length;
    const paidCount = paidEntries.length;
    const totalPaidValue = paidEntries
      .map((e) => String(e.value).replace(",", "."))
      .reduce((sum, e) => (sum += Number(e)), 0);

    const pendingCount = totalMonths - paidCount;
    const monthlyAmount = Number(
      member?.paymentInfo.amount.replace(",", ".") ?? 0,
    );

    return {
      paidCount,
      totalMonths,
      totalPaidValue,
      pendingCount,
      pendingValue: pendingCount * monthlyAmount,
      pct: totalMonths ? (paidCount / totalMonths) * 100 : 0,
      overdue: entries.some((e) => e.index < currentMonthIndex && !e.paid),
    };
  }, [member]);

  return (
    <div className={styles.container}>
      <Header
        name={`${member?.firstName ?? ""} ${member?.lastName ?? ""}`}
        photo={member?.profileImage}
        crumbs={[{ label: "Contribuições" }]}
      />

      <div className={styles.content}>
        {isDesktop && (
          <div className={styles.pageHead}>
            <p className="eyebrow">
              Suas contribuições ·{" "}
              {member?.contributions.year ?? new Date().getFullYear()}
            </p>
            <h1 className={styles.pageTitle}>Contribuições</h1>
            <p className={styles.pageSubtitle}>
              Acompanhe seu dízimo mês a mês, emita comprovantes e faça doações
              extras para a comunidade.
            </p>
          </div>
        )}

        {isDesktop && (
          <div className={styles.summaryGrid}>
            <div className={`card card-pad ${styles.progressCard}`}>
              <div className={styles.progressHead}>
                <span className="cap">Progresso do ano</span>
                <span
                  className={`pill ${summary.overdue ? "pill-wait" : "pill-ok"}`}
                >
                  <span className="pd" />
                  {summary.overdue ? "Pendências" : "Em dia"}
                </span>
              </div>
              <div className={styles.progressValue}>
                <span className={`${styles.progressNumber}`}>
                  {summary.paidCount}
                </span>
                <span className={styles.progressLabel}>
                  de {summary.totalMonths} meses pagos
                </span>
              </div>
              <div className="bar">
                <i style={{ width: `${summary.pct}%` }} />
              </div>
            </div>

            <div className="tile">
              <div className="t-top">
                <span className="t-ic">
                  <CheckCircle2 size={17} />
                </span>
                Total pago
              </div>
              <div className="t-val money">
                {formatMoneyBRL(summary.totalPaidValue)}
              </div>
              <div className="t-sub">
                {summary.paidCount === 1
                  ? "1 pagamento confirmado"
                  : `${summary.paidCount} pagamentos confirmados`}
              </div>
            </div>

            <div className="tile">
              <div className="t-top">
                <span
                  className="t-ic"
                  style={{
                    background: "var(--warn-soft)",
                    color: "var(--warn)",
                  }}
                >
                  <AlertTriangle size={17} />
                </span>
                Em aberto
              </div>
              <div className="t-val money">
                {formatMoneyBRL(summary.pendingValue)}
              </div>
              <div className="t-sub">
                {summary.pendingCount === 1
                  ? "1 mês pendente"
                  : `${summary.pendingCount} meses pendentes`}
              </div>
            </div>
          </div>
        )}

        <CoachTarget id="bills-donation">
          <button
            type="button"
            onClick={() => setDonateModalVisible(true)}
            className={styles.donateBanner}
          >
            <span className={styles.donateIcon}>
              <HandHeart color={colors.white} size={28} />
            </span>
            <div className={styles.donateText}>
              <p className={styles.donateTitle}>Fazer uma doação</p>
              <p className={styles.donateSubtitle}>
                Contribua com um valor extra, além do dízimo, via PIX ou
                dinheiro.
              </p>
            </div>
            {isDesktop && <span className={styles.donateCta}>Doar agora</span>}
          </button>
        </CoachTarget>

        {isDesktop && (
          <div className={styles.sectionHead}>
            <h2>Mensalidades</h2>
            <span className={styles.sectionCount}>
              {summary.totalMonths} meses
            </span>
          </div>
        )}

        {isDesktop ? (
          <div className={styles.monthsGrid}>
            {contributions.map((item) => (
              <ContributionItem
                key={item.id}
                data={item}
                onPay={() => handlePay(item)}
                onShare={() =>
                  setComprovanteItem({
                    ...item,
                    cpf: member?.identification.numberType as string,
                    docType: member?.identification.type,
                    name: member?.firstName as string,
                    email: member?.email as string,
                  })
                }
              />
            ))}
          </div>
        ) : (
          contributions.map((item) => (
            <ContributionItem
              key={item.id}
              data={item}
              onPay={() => handlePay(item)}
              onShare={() =>
                setComprovanteItem({
                  ...item,
                  cpf: member?.identification.numberType as string,
                  docType: member?.identification.type,
                  name: member?.firstName as string,
                  email: member?.email as string,
                })
              }
            />
          ))
        )}
      </div>

      {modalPayVisible && (
        <PixPaymentModal
          visible={modalPayVisible}
          onClose={() => setModalPayVisible(false)}
          payment={{
            amountLabel: `${charge.transactionAmount ?? ""}`.replace(".", ","),
            qrCode: charge.transactionData?.qrCode ?? "",
            status: charge.status,
          }}
        />
      )}

      {comprovanteItem && (
        <ModalComprovante
          visible={!!comprovanteItem}
          onClose={() => setComprovanteItem(null)}
          data={comprovanteItem}
        />
      )}

      {donateModalVisible && (
        <ModalDonate
          visible={donateModalVisible}
          onClose={() => setDonateModalVisible(false)}
          isAdmin={member?.role === "admin"}
        />
      )}
    </div>
  );
}
