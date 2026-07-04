"use client";

import { ModalBase } from "@/components/ModalBase";
import { TRANSACTION_STATUS } from "@/types/Charge";
import { Check, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import styles from "./PixPaymentModal.module.css";

// Portado de resgatar_app/src/screens/BillsScreen/PixPaymentModal. Animated
// (fade/scale/pulse) vira CSS (@keyframes); Clipboard nativo vira
// navigator.clipboard. Componente presentacional: quem monta (charge ou
// doação) é dono do estado e atualiza `status` para approved.

interface PixPayment {
  amountLabel: string; // valor sem "R$", ex. "50,00"
  qrCode: string;
  status: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  payment: PixPayment;
}

export function PixPaymentModal({ visible, onClose, payment }: Props) {
  const [isCopied, setIsCopied] = useState(false);

  async function copyToClipboard(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Clipboard indisponível (ex.: contexto não seguro) — silencioso.
    }
  }

  // A confirmação chega de forma assíncrona (ver ChargeContext/ModalDonate).
  // Mantemos "Pago" visível por um instante antes de fechar o modal sozinho.
  useEffect(() => {
    if (payment.status !== TRANSACTION_STATUS.APPROVED) return;

    const timeout = setTimeout(onClose, 1800);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment.status]);

  return (
    <ModalBase onClose={onClose} visible={visible} title="Pagamento PIX">
      <div className={styles.container}>
        {payment.status === TRANSACTION_STATUS.PENDING && (
          <div className={[styles.badge, styles.badgePulse].join(" ")}>
            <span className={styles.badgeText}>Aguardando pagamento</span>
          </div>
        )}

        {payment.status === TRANSACTION_STATUS.APPROVED && (
          <div className={[styles.badge, styles.badgePaid].join(" ")}>
            <span className={styles.badgePaidText}>Pago</span>
          </div>
        )}

        <div className={styles.amountContainer}>
          <p className={styles.amountLabel}>Valor a pagar</p>
          <p className={styles.amount}>R$ {payment.amountLabel}</p>
        </div>

        {!!payment.qrCode && (
          <div className={styles.qrContainer}>
            <div className={styles.qrBox}>
              <QRCodeSVG
                value={payment.qrCode}
                size={200}
                fgColor="#3E3328"
                bgColor="transparent"
              />
            </div>
          </div>
        )}

        {!!payment.qrCode && (
          <>
            <p className={styles.helperText}>
              Escaneie o QR Code ou copie o código PIX
            </p>

            <div className={styles.pixCodeContainer}>
              <p className={styles.pixCode}>{payment.qrCode}</p>

              <div className={styles.containerCopy}>
                {isCopied && (
                  <div className={styles.tooltipContainer}>
                    <div className={styles.balloon}>
                      <span className={styles.balloonText}>Copiado!</span>
                    </div>
                    <div className={styles.arrow} />
                  </div>
                )}

                <button
                  type="button"
                  className={styles.copyButton}
                  onClick={() => copyToClipboard(payment.qrCode)}
                  aria-label="Copiar código PIX"
                >
                  {isCopied ? (
                    <Check size={18} color="#fff" />
                  ) : (
                    <Copy size={18} color="#fff" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        <div className={styles.infoBox}>
          <p className={styles.infoText}>
            Após o pagamento, a confirmação será enviada automaticamente em
            até 5 minutos.
          </p>
        </div>
      </div>
    </ModalBase>
  );
}
