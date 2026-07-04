"use client";

import { Button } from "@/components/Button";
import { ModalBase } from "@/components/ModalBase";
import { LogoResgatar } from "@/components/Svg/Logo";
import { ToastMessage } from "@/components/Toast";
import { useAppTheme } from "@/context/ThemeContext";
import { Share2 } from "lucide-react";
import { useState } from "react";
import styles from "./ModalComprovante.module.css";

// Portado de resgatar_app/src/screens/BillsScreen/ModalComprovante. O app
// gera um PDF (expo-print + expo-sharing) a partir do HTML de
// generatePixReceipt; o web ainda não tem geração de PDF, então
// "Compartilhar" usa a Web Share API, com fallback para copiar um resumo em
// texto para a área de transferência.

type ComprovanteData = {
  name: string;
  email: string;
  cpf: string;
  docType?: string;
  month: string;
  paidAt: string;
  value: string;
  method?: string;
};

interface Props {
  visible: boolean;
  onClose: () => void;
  data: ComprovanteData;
}

export function ModalComprovante({ visible, onClose, data }: Props) {
  const { colors } = useAppTheme();
  const [sharing, setSharing] = useState(false);

  async function handleShare() {
    setSharing(true);
    try {
      const text = [
        "Comunidade Resgatar — Comprovante de Pagamento",
        `Associado: ${data.name}`,
        `E-mail: ${data.email}`,
        data.cpf ? `${data.docType ?? "CPF"}: ${data.cpf}` : null,
        `Referência: ${data.month}`,
        `Pago em: ${data.paidAt}`,
        `Método: ${data.method ?? "PIX"}`,
        `Valor pago: ${data.value}`,
      ]
        .filter(Boolean)
        .join("\n");

      if (navigator.share) {
        await navigator.share({ title: "Comprovante de pagamento", text });
      } else {
        await navigator.clipboard.writeText(text);
        ToastMessage.success(
          "Comprovante copiado",
          "O resumo foi copiado para a área de transferência.",
        );
      }
    } catch {
      // Usuário cancelou o compartilhamento ou clipboard indisponível.
    } finally {
      setSharing(false);
    }
  }

  return (
    <ModalBase visible={visible} onClose={onClose} title="Comprovante">
      <div className={styles.container}>
        <div className={styles.header}>
          <LogoResgatar size={100} color={colors.primary} />
          <p className={styles.orgName}>Comunidade Resgatar</p>
          <p className={styles.subtitle}>Comprovante de Pagamento</p>
          <div className={styles.badge}>
            <span className={styles.badgeText}>✓ Pagamento confirmado</span>
          </div>
        </div>

        <div className={styles.card}>
          <p className={styles.cardTitle}>Dados do Associado</p>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Associado</span>
            <span className={styles.rowValue}>{data.name}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>E-mail</span>
            <span className={styles.rowValue}>{data.email}</span>
          </div>
          {!!data.cpf && (
            <div className={[styles.row, styles.rowLast].join(" ")}>
              <span className={styles.rowLabel}>{data.docType ?? "CPF"}</span>
              <span className={styles.rowValue}>{data.cpf}</span>
            </div>
          )}
        </div>

        <div className={styles.card}>
          <p className={styles.cardTitle}>Detalhes do Pagamento</p>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Referência</span>
            <span className={styles.rowValue}>{data.month}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Pago em</span>
            <span className={styles.rowValue}>{data.paidAt}</span>
          </div>
          <div className={[styles.row, styles.rowLast].join(" ")}>
            <span className={styles.rowLabel}>Método</span>
            <span className={styles.rowValue}>{data.method ?? "PIX"}</span>
          </div>
        </div>

        <div className={styles.totalCard}>
          <span className={styles.totalLabel}>Valor pago</span>
          <span className={styles.totalValue}>{data.value}</span>
        </div>

        <Button
          title="Compartilhar"
          leftIcon={<Share2 color={colors.white} size={18} />}
          onPress={handleShare}
          loading={sharing}
          disabled={sharing}
        />
      </div>
    </ModalBase>
  );
}
