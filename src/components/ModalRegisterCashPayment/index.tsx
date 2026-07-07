"use client";

import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { Input } from "@/components/Input";
import { ModalBase } from "@/components/ModalBase";
import { MemberListWithSkeleton } from "@/components/Skeleton/MemberListWithSkeleton";
import { ToastMessage } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { ChargeServices } from "@/services/ChargeService";
import { MemberServices } from "@/services/MemberService";
import { IMember, IMemberWithContribution } from "@/types/Member";
import { formatDateFromTimestamp, formatMoneyBRL } from "@/utils/helper";
import { currencyToBackendBRL, maskCurrencyBRL, onlyNumbers } from "@/utils/mask";
import { HandCoins } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./ModalRegisterCashPayment.module.css";

// Portado de resgatar_app/src/screens/SettingsScreen/ModalRegisterCashPayment.

type Props = {
  visible: boolean;
  onClose: () => void;
};

const MONTHS: { key: string; label: string }[] = [
  { key: "january", label: "Janeiro" },
  { key: "february", label: "Fevereiro" },
  { key: "march", label: "Março" },
  { key: "april", label: "Abril" },
  { key: "may", label: "Maio" },
  { key: "june", label: "Junho" },
  { key: "july", label: "Julho" },
  { key: "august", label: "Agosto" },
  { key: "september", label: "Setembro" },
  { key: "october", label: "Outubro" },
  { key: "november", label: "Novembro" },
  { key: "december", label: "Dezembro" },
];

export function ModalRegisterCashPayment({ visible, onClose }: Props) {
  const { listMembers, reloadMemberData } = useAuth();
  const { colors } = useAppTheme();

  const [members, setMembers] = useState<IMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [detail, setDetail] = useState<IMemberWithContribution | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null);
  const [registering, setRegistering] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<null | { index: number; label: string }>(null);
  // Valor a registrar, editável no diálogo de confirmação. Guardado como
  // dígitos de centavos (mesmo formato usado pelo maskCurrencyBRL/ModalDonate).
  const [confirmValue, setConfirmValue] = useState("");

  async function loadMembers() {
    setLoadingMembers(true);
    try {
      const response = await listMembers();
      setMembers(response as unknown as IMember[]);
    } finally {
      setLoadingMembers(false);
    }
  }

  useEffect(() => {
    if (!visible) return;
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  async function loadDetail(memberId: string) {
    setLoadingDetail(true);
    try {
      const data = await MemberServices.getMemberById(memberId);
      setDetail(data);
    } catch {
      ToastMessage.error("Erro", "Não foi possível carregar o membro.");
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleSelectMember(member: IMember) {
    setLoadingMemberId(member._id);
    await loadDetail(member._id);
    setLoadingMemberId(null);
  }

  function handleBack() {
    setDetail(null);
  }

  async function handleConfirm() {
    if (!confirm || !detail) return;
    if (Number(onlyNumbers(confirmValue)) <= 0) {
      ToastMessage.error("Informe um valor válido para o pagamento.");
      return;
    }
    setRegistering(confirm.index);
    try {
      await ChargeServices.registerCashPayment(detail._id, confirm.index, currencyToBackendBRL(confirmValue));
      ToastMessage.success("Pagamento registrado", `${confirm.label} de ${detail.firstName} marcado como pago.`);
      setConfirm(null);
      await Promise.all([loadDetail(detail._id), reloadMemberData()]);
    } catch {
      ToastMessage.error("Erro ao registrar pagamento. Tente novamente.");
    } finally {
      setRegistering(null);
    }
  }

  const months = detail
    ? MONTHS.map((m, index) => {
        const data = detail.contributions?.months?.[m.key as keyof typeof detail.contributions.months] as
          | { paid: boolean; value: number; paidAt: string }
          | undefined;
        return { month: m, index, data };
      })
        .filter(({ data }) => data !== undefined)
        .map(({ month, index, data }) => {
          const paid = !!data!.paid;
          return {
            index,
            label: month.label,
            paid,
            description: paid
              ? `Pago em ${formatDateFromTimestamp(new Date(data!.paidAt).getTime())}`
              : `A pagar · ${formatMoneyBRL(detail.paymentInfo?.amount ?? 0)}`,
          };
        })
    : [];

  return (
    <ModalBase
      onClose={detail ? handleBack : onClose}
      visible={visible}
      title={detail ? `${detail.firstName} ${detail.lastName}` : "Registrar pagamento"}
    >
      <div className={styles.container}>
        {!detail ? (
          <MemberListWithSkeleton
            members={members}
            loading={loadingMembers}
            onAction={handleSelectMember}
            iconAction={<HandCoins size={20} color={colors.primary} />}
            variant="edit"
            loadingMemberId={loadingMemberId ?? undefined}
          />
        ) : loadingDetail ? (
          <div className={styles.loadingWrap}>
            <span className={styles.spinner} style={{ borderTopColor: colors.primary }} />
          </div>
        ) : (
          <div className={styles.list}>
            <div className={styles.memberHeader}>
              <Avatar photo={detail.profileImage} size={44} />
              <div>
                <p className={styles.memberName}>
                  {detail.firstName} {detail.lastName}
                </p>
                <p className={styles.memberEmail}>{detail.email}</p>
              </div>
            </div>

            {months.map((item) => (
              <div key={item.index} className={styles.monthCard}>
                <div className={styles.monthInfo}>
                  <p className={styles.monthName}>{item.label}</p>
                  <p className={styles.monthDescription}>{item.description}</p>
                </div>

                {item.paid ? (
                  <span className={[styles.badge, styles.paid].join(" ")}>
                    <span className={styles.paidText}>Pago</span>
                  </span>
                ) : registering === item.index ? (
                  <span className={styles.spinner} style={{ borderTopColor: colors.primary }} />
                ) : (
                  <Button
                    title="Registrar"
                    variant="secondary"
                    style={{ minHeight: 40, paddingInline: "var(--spacing-md)", width: "auto" }}
                    onPress={() => {
                      setConfirm({ index: item.index, label: item.label });
                      setConfirmValue(onlyNumbers(detail.paymentInfo?.amount || ""));
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {confirm && detail && (
        <Dialog
          visible={!!confirm}
          title="Pagamento em dinheiro"
          description={`Confirmar recebimento em dinheiro de ${detail.firstName}, referente a ${confirm.label}?`}
          onClose={() => registering === null && setConfirm(null)}
          actions={[
            { label: "cancelar", variant: "secondary", onPress: () => registering === null && setConfirm(null) },
            { label: "confirmar", variant: "primary", onPress: handleConfirm },
          ]}
        >
          <Input
            label="Valor recebido"
            placeholder="R$ 0,00"
            inputMode="numeric"
            value={confirmValue ? maskCurrencyBRL(confirmValue) : ""}
            onChangeText={setConfirmValue}
          />
        </Dialog>
      )}
    </ModalBase>
  );
}
