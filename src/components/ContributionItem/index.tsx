"use client";

import { useAppTheme } from "@/context/ThemeContext";
import { TRANSACTION_STATUS } from "@/types/Charge";
import { Eye, QrCode } from "lucide-react";
import { Button } from "../Button";
import styles from "./ContributionItem.module.css";

// Portado de resgatar_app/src/components/ContributionItem.

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
  const isPending = data.status === TRANSACTION_STATUS.PENDING;

  return (
    <div className={styles.card}>
      <div className={styles.row}>
        <div className={styles.info}>
          <p className={styles.month}>{data.month}</p>
          <p className={styles.description}>{data.description}</p>
        </div>

        <div className={styles.right}>
          <p className={styles.value}>{data.value}</p>

          <span className={[styles.badge, isPending ? styles.pending : styles.paid].join(" ")}>
            <span className={isPending ? styles.pendingText : styles.paidText}>
              {isPending ? "Pendente" : "Pago"}
            </span>
          </span>
        </div>
      </div>

      <div className={styles.divider} />

      {isPending ? (
        <Button
          title="Pagar"
          onPress={async () => {
            await onPay();
          }}
          style={{ marginTop: 16 }}
          leftIcon={<QrCode size={20} color={mode === "dark" ? colors.black : colors.white} />}
        />
      ) : (
        <Button
          title="Comprovante"
          onPress={onShare}
          style={{ marginTop: 16 }}
          leftIcon={<Eye size={20} color={colors.primary} />}
          variant="secondary"
        />
      )}
    </div>
  );
}
