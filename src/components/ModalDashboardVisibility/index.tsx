"use client";

import { ModalBase } from "@/components/ModalBase";
import { Switch } from "@/components/Switch";
import { ToastMessage } from "@/components/Toast";
import { useDashboardVisibility } from "@/context/DashboardVisibilityContext";
import { DashboardVisibilityServices } from "@/services/DashboardVisibilityService";
import { IDashboardVisibilitySettings } from "@/types/DashboardVisibility";
import { useState } from "react";
import styles from "./ModalDashboardVisibility.module.css";

type CardKey = keyof IDashboardVisibilitySettings;

const CARD_LABELS: Record<CardKey, { title: string; description: string }> = {
  banners: {
    title: "Banners de campanha",
    description: "Carrossel de campanhas ativas no topo da tela de Início.",
  },
  notices: {
    title: "Mural de compromissos",
    description: "Agenda e avisos da vida interna da comunidade.",
  },
  birthdays: {
    title: "Aniversariantes do mês",
    description: "Nome e data de nascimento dos membros internos.",
  },
  communityGoal: {
    title: "Meta da comunidade",
    description: "Progresso da arrecadação do mês e valores envolvidos.",
  },
  videos: {
    title: "Vídeos",
    description: "Listagem de vídeos publicados pela comunidade.",
  },
};

const CARD_ORDER: CardKey[] = ["banners", "videos", "notices", "communityGoal", "birthdays"];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function ModalDashboardVisibility({ visible, onClose }: Props) {
  const { settings, loading, refetch } = useDashboardVisibility();
  const [savingKey, setSavingKey] = useState<CardKey | null>(null);

  async function toggle(key: CardKey, value: boolean) {
    setSavingKey(key);
    try {
      await DashboardVisibilityServices.update({ [key]: value });
      await refetch();
    } catch {
      ToastMessage.error("Erro", "Não foi possível salvar a visibilidade.");
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <ModalBase visible={visible} onClose={onClose} title="Visibilidade do convidado">
      <div className={styles.content}>
        <p className={styles.subtitle}>
          Escolha o que um convidado (ainda não promovido a membro) pode ver na
          tela de Início. Contribuições e gestão financeira nunca ficam
          disponíveis para convidado, independente destas opções.
        </p>

        <div className={styles.list}>
          {CARD_ORDER.map((key) => (
            <div key={key} className={styles.row}>
              <div className={styles.rowText}>
                <span className={styles.rowTitle}>{CARD_LABELS[key].title}</span>
                <span className={styles.rowDescription}>{CARD_LABELS[key].description}</span>
              </div>
              <Switch
                checked={settings?.[key] === true}
                disabled={loading || savingKey === key}
                label={CARD_LABELS[key].title}
                onChange={(value) => toggle(key, value)}
              />
            </div>
          ))}
        </div>
      </div>
    </ModalBase>
  );
}
