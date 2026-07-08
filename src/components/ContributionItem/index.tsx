"use client";

import { useAppTheme } from "@/context/ThemeContext";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { TRANSACTION_STATUS } from "@/types/Charge";
import { Eye, QrCode } from "lucide-react";
import { Button } from "../Button";
import styles from "./ContributionItem.module.css";

// Portado de resgatar_app/src/components/ContributionItem. No desktop
// (>=1024px) o card ganha um layout próprio, fiel ao redesenho editorial
// "Missal" (pílula de status ao lado do mês, valor em linha própria, ação no
// rodapé) — o mobile mantém exatamente o card compacto original.

interface Contribution {
  id: string;
  month: string;
  value: string;
  status: string;
  description: string;
}

interface Props {
  data: Contribution;
  onPay: () => Promise<void>;
  onShare?: () => void;
}

export function ContributionItem({ data, onPay, onShare }: Props) {
  const { colors, mode } = useAppTheme();
  const { isDesktop } = useBreakpoint();
  const isPending = data.status === TRANSACTION_STATUS.PENDING;

  const actionButton = isPending ? (
    <Button
      title="Pagar"
      onPress={async () => {
        await onPay();
      }}
      style={{ marginTop: isDesktop ? 0 : 16 }}
      leftIcon={
        <QrCode
          size={20}
          color={mode === "dark" ? colors.black : colors.white}
        />
      }
    />
  ) : (
    <Button
      title="Comprovante"
      onPress={onShare}
      style={{ marginTop: isDesktop ? 0 : 16 }}
      leftIcon={<Eye size={20} color={colors.primary} />}
      variant="secondary"
    />
  );

  if (isDesktop) {
    return (
      <div className={styles.cardDesktop}>
        <div className={styles.bodyDesktop}>
          <div className={styles.headRowDesktop}>
            <div>
              <p className={styles.monthDesktop}>{data.month}</p>
              <p className={styles.descriptionDesktop}>{data.description}</p>
            </div>
            <span
              className={[
                styles.pillDesktop,
                isPending ? styles.pillWaitDesktop : styles.pillOkDesktop,
              ].join(" ")}
            >
              {isPending ? "Pendente" : "Pago"}
            </span>
          </div>
          <p className={styles.valueDesktop}>{data.value}</p>
        </div>
        <div className={styles.footerDesktop}>{actionButton}</div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.row}>
        <div className={styles.info}>
          <p className={styles.month}>{data.month}</p>
          <p className={styles.description}>{data.description}</p>
        </div>

        <div className={styles.right}>
          <p className={styles.value}>{data.value}</p>

          <span
            className={[
              styles.badge,
              isPending ? styles.pending : styles.paid,
            ].join(" ")}
          >
            <span className={isPending ? styles.pendingText : styles.paidText}>
              {isPending ? "Pendente" : "Pago"}
            </span>
          </span>
        </div>
      </div>

      <div className={styles.divider} />

      {actionButton}
    </div>
  );
}
