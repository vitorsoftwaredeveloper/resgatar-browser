"use client";

import { Button } from "@/components/Button";
import { ModalDonate } from "@/components/ModalDonate";
import { HandHeart, UserRoundCheck } from "lucide-react";
import { useState } from "react";
import styles from "./GuestHomeCard.module.css";

export function GuestHomeCard() {
  const [donateModalVisible, setDonateModalVisible] = useState(false);

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
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

          <Button
            title="Fazer uma doação"
            leftIcon={<HandHeart size={18} color="var(--color-white)" />}
            onPress={() => setDonateModalVisible(true)}
            className={styles.donateButton}
          />
        </div>
      </div>

      <ModalDonate
        visible={donateModalVisible}
        onClose={() => setDonateModalVisible(false)}
        isAdmin={false}
      />
    </>
  );
}
