"use client";

import { ModalDonate } from "@/components/ModalDonate";
import { NoticesCardSkeleton } from "@/components/Skeleton/NoticesCardSkeleton";
import { useAppTheme } from "@/context/ThemeContext";
import { DonationServices } from "@/services/DonationService";
import { TRANSACTION_STATUS } from "@/types/Charge";
import { IDonation } from "@/types/Donation";
import { formatMoneyBRL } from "@/utils/helper";
import { Banknote, HandCoins, HandHeart, QrCode, UserRoundCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import styles from "./GuestHomeCard.module.css";

const DISPLAY_LIMIT = 5;

export function GuestHomeCard() {
  const { colors } = useAppTheme();
  const [donateModalVisible, setDonateModalVisible] = useState(false);
  const [donations, setDonations] = useState<IDonation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDonations = useCallback(() => {
    setLoading(true);
    DonationServices.listMine()
      .then(setDonations)
      .catch(() => setDonations([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadDonations();
  }, [loadDonations]);

  function handleCloseDonateModal() {
    setDonateModalVisible(false);
    loadDonations();
  }

  const items = donations.slice(0, DISPLAY_LIMIT);

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header} style={{ flex: "none" }}>
          <span className={styles.label}>VOCÊ ESTÁ COMO CONVIDADO</span>
        </div>

        <div className={styles.body}>
          <div className={styles.row}>
            <UserRoundCheck size={20} color="var(--color-primary)" />
            <p className={styles.text}>
              Para acessar contribuições e a vida interna da comunidade, fale
              com um coordenador.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setDonateModalVisible(true)}
            className={styles.donateBanner}
          >
            <span className={styles.donateIcon}>
              <HandHeart color={colors.white} size={26} />
            </span>
            <div className={styles.donateText}>
              <p className={styles.donateTitle}>Fazer uma doação</p>
              <p className={styles.donateSubtitle}>
                Contribua com um valor livre, via PIX.
              </p>
            </div>
          </button>

          <div className={styles.donationsSection}>
            <span className={styles.sectionLabel}>Suas doações no mês</span>

            {loading ? (
              <NoticesCardSkeleton rows={2} />
            ) : items.length === 0 ? (
              <div className={styles.emptyState}>
                <HandCoins size={20} color="var(--color-text-muted)" />
                <p className={styles.emptyText}>
                  Nenhuma doação sua neste mês
                </p>
              </div>
            ) : (
              items.map((item, i) => {
                const isPix = item.paymentMethodId === "pix";
                const isApproved = item.status === TRANSACTION_STATUS.APPROVED;
                return (
                  <div
                    key={item.transactionId}
                    className={[
                      styles.donationRow,
                      i < items.length - 1 && styles.donationRowBorder,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <div className={styles.methodIcon}>
                      {isPix ? (
                        <QrCode size={16} color={colors.info} />
                      ) : (
                        <Banknote size={16} color={colors.success} />
                      )}
                    </div>
                    <div className={styles.donationTexts}>
                      <p className={styles.donationMeta}>
                        {isPix ? "PIX" : "Dinheiro"}
                      </p>
                      {item.createdAt && (
                        <p className={styles.donationDate}>
                          {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                    <div className={styles.donationValues}>
                      <span className={styles.donationValue}>
                        {formatMoneyBRL(item.amount)}
                      </span>
                      {!isApproved && (
                        <span className={styles.donationStatus}>
                          {item.status === TRANSACTION_STATUS.PENDING
                            ? "Pendente"
                            : "Não confirmada"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <ModalDonate
        visible={donateModalVisible}
        onClose={handleCloseDonateModal}
        isAdmin={false}
      />
    </>
  );
}
