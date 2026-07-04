"use client";

import { CoachTarget } from "@/components/CoachTarget";
import { ContributionItem } from "@/components/ContributionItem";
import { Header } from "@/components/Header";
import { ModalComprovante } from "@/components/ModalComprovante";
import { ModalDonate } from "@/components/ModalDonate";
import { PixPaymentModal } from "@/components/PixPaymentModal";
import { ToastMessage } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { useCharge } from "@/context/ChargeContext";
import { useAppTheme } from "@/context/ThemeContext";
import { TRANSACTION_STATUS } from "@/types/Charge";
import { formatDateFromTimestamp, formatMoneyBRL } from "@/utils/helper";
import { HandHeart } from "lucide-react";
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

  return (
    <div className={styles.container}>
      <Header
        name={`${member?.firstName ?? ""} ${member?.lastName ?? ""}`}
        photo={member?.profileImage}
      />

      <div className={styles.content}>
        <CoachTarget id="bills-donation">
          <button
            type="button"
            onClick={() => setDonateModalVisible(true)}
            className={styles.donateBanner}
          >
            <HandHeart color={colors.white} size={28} />
            <div className={styles.donateText}>
              <p className={styles.donateTitle}>Fazer uma doação</p>
              <p className={styles.donateSubtitle}>
                Contribua com um valor extra via PIX ou dinheiro
              </p>
            </div>
          </button>
        </CoachTarget>

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
