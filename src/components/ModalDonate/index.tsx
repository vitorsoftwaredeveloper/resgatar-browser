"use client";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { ModalBase } from "@/components/ModalBase";
import { PixPaymentModal } from "@/components/PixPaymentModal";
import { ToastMessage } from "@/components/Toast";
import { DonationServices } from "@/services/DonationService";
import { TRANSACTION_STATUS } from "@/types/Charge";
import { IDonation } from "@/types/Donation";
import {
  currencyToBackendBRL,
  maskCurrencyBRL,
  onlyNumbers,
} from "@/utils/mask";
import { useEffect, useState } from "react";
import styles from "./ModalDonate.module.css";

// Portado de resgatar_app/src/screens/ProfileScreen/ModalDonate. A confirmação
// do PIX no app chega por push (FCM); o web ainda não tem essa infraestrutura,
// então mantemos apenas a rede de segurança do RN: reconsulta ao voltar o foco
// da aba e um polling leve enquanto a doação está pendente.

const QUICK_AMOUNTS = [10, 20, 50, 100];

interface Props {
  visible: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

export function ModalDonate({ visible, onClose, isAdmin }: Props) {
  const [amount, setAmount] = useState("10,00");
  const [donorName, setDonorName] = useState("");
  const [pixLoading, setPixLoading] = useState(false);
  const [cashLoading, setCashLoading] = useState(false);

  // Doação PIX criada: enquanto existe, mostramos o modal de QR.
  const [donation, setDonation] = useState<IDonation | null>(null);
  const [pixStatus, setPixStatus] = useState(TRANSACTION_STATUS.PENDING);

  const amountCents = Number(onlyNumbers(amount));

  function reset() {
    setAmount("");
    setDonorName("");
    setPixLoading(false);
    setCashLoading(false);
    setDonation(null);
    setPixStatus(TRANSACTION_STATUS.PENDING);
  }

  function handleClose() {
    reset();
    onClose();
  }

  // Fallback: enquanto a doação está pendente, reconsulta o status ao voltar
  // ao foreground (aba volta a ficar visível) e em um polling leve.
  useEffect(() => {
    if (!donation || pixStatus === TRANSACTION_STATUS.APPROVED) return;

    let cancelled = false;

    async function checkStatus() {
      try {
        const current = await DonationServices.consult(
          donation!.transactionId,
        );
        if (!cancelled && current.status === TRANSACTION_STATUS.APPROVED) {
          setPixStatus(TRANSACTION_STATUS.APPROVED);
        }
      } catch {
        // Silencioso: é apenas um fallback.
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible") checkStatus();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    const interval = setInterval(checkStatus, 5000);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
    };
  }, [donation, pixStatus]);

  async function handlePix() {
    if (amountCents <= 0) {
      ToastMessage.error("Informe um valor para doar.");
      return;
    }
    setPixLoading(true);
    try {
      const created = await DonationServices.createPix(
        currencyToBackendBRL(amount),
        donorName.trim() || undefined,
      );
      setDonation(created);
      setPixStatus(created.status);
    } catch {
      ToastMessage.error("Erro ao gerar a doação PIX. Tente novamente.");
    } finally {
      setPixLoading(false);
    }
  }

  async function handleCash() {
    if (amountCents <= 0) {
      ToastMessage.error("Informe um valor para doar.");
      return;
    }
    setCashLoading(true);
    try {
      await DonationServices.registerCash(
        currencyToBackendBRL(amount),
        donorName.trim() || undefined,
      );
      ToastMessage.success(
        "Doação registrada",
        "A doação em dinheiro foi registrada.",
      );
      // Deixa o modal aberto até o toast subir antes de fechar/desmontar.
      setTimeout(handleClose, 800);
    } catch {
      ToastMessage.error("Erro ao registrar a doação. Tente novamente.");
    } finally {
      setCashLoading(false);
    }
  }

  return (
    <>
      <ModalBase
        visible={visible && !donation}
        onClose={handleClose}
        title="Fazer uma doação"
      >
        <div className={styles.container}>
          <Input
            label="Valor"
            placeholder="R$ 0,00"
            inputMode="numeric"
            value={amount ? maskCurrencyBRL(amount) : ""}
            onChangeText={setAmount}
          />

          <div className={styles.quickAmounts}>
            {QUICK_AMOUNTS.map((value) => {
              const selected = amountCents === value * 100;
              return (
                <button
                  key={value}
                  type="button"
                  className={[
                    styles.chip,
                    selected ? styles.chipSelected : "",
                  ].join(" ")}
                  onClick={() => setAmount(String(value * 100))}
                >
                  <span
                    className={[
                      styles.chipText,
                      selected ? styles.chipTextSelected : "",
                    ].join(" ")}
                  >
                    R$ {value}
                  </span>
                </button>
              );
            })}
          </div>

          <Input
            label="Nome do doador (opcional)"
            placeholder="Quem está doando?"
            value={donorName}
            onChangeText={setDonorName}
            maxLength={120}
          />
          <p className={styles.hint}>Deixe em branco se a doação é sua.</p>

          <div className={styles.actions}>
            {isAdmin && (
              <Button
                title="Em dinheiro"
                variant="secondary"
                loading={cashLoading}
                disabled={pixLoading}
                onPress={handleCash}
                className={styles.actionButton}
              />
            )}
            <Button
              title="Doar via PIX"
              loading={pixLoading}
              disabled={cashLoading}
              onPress={handlePix}
              className={isAdmin ? styles.actionButton : undefined}
            />
          </div>
        </div>
      </ModalBase>

      {donation && (
        <PixPaymentModal
          visible={!!donation}
          onClose={handleClose}
          payment={{
            amountLabel: donation.amount,
            qrCode: donation.transactionData?.qrCode ?? "",
            status: pixStatus,
          }}
        />
      )}
    </>
  );
}
