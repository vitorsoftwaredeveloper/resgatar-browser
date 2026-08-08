"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ModalBase } from "@/components/ModalBase";
import { useNotifications } from "@/context/NotificationsContext";
import { Bell, BellOff, BellRing } from "lucide-react";
import { useClientValue } from "@/hooks/useClientValue";
import {
  isPushBlockedInThisTab,
  reEnableNotificationsInstruction,
} from "@/utils/device";
import styles from "./ModalNotificationPermission.module.css";

interface Props {
  visible: boolean;
  onClose: () => void;
}

const BENEFITS = [
  "Avisos de cobranças e pagamentos pendentes.",
  "Comunicados e novidades da comunidade.",
  "Pode ser desativado a qualquer momento, direto por aqui.",
];

export function ModalNotificationPermission({ visible, onClose }: Props) {
  const { permission, active, requesting, disabling, requestPermission, disableNotifications } =
    useNotifications();

  const blockedInThisTab = useClientValue(isPushBlockedInThisTab, false);
  const reEnableSteps = useClientValue(reEnableNotificationsInstruction, "");

  const canActivate =
    !blockedInThisTab &&
    (permission === "default" || (permission === "granted" && !active));

  const status = active
    ? {
        icon: <BellRing size={40} className={styles.iconGranted} />,
        label: "Ativado",
        statusClass: styles.statusGranted,
        description: "Este navegador está recebendo notificações do Resgatar agora.",
      }
    : permission === "denied"
      ? {
          icon: <BellOff size={40} className={styles.iconDenied} />,
          label: "Bloqueado",
          statusClass: styles.statusDenied,
          description: `Você bloqueou as notificações para este site. Para reativar, ${reEnableSteps}`,
        }
      : permission === "unsupported"
        ? {
            icon: <BellOff size={40} className={styles.iconDenied} />,
            label: "Indisponível",
            statusClass: styles.statusDenied,
            description: "Este navegador não tem suporte a notificações web.",
          }
        : blockedInThisTab
          ? {
              icon: <BellOff size={40} className={styles.iconDenied} />,
              label: "Instale o app",
              statusClass: styles.statusDefault,
              description:
                "No iPhone as notificações só funcionam pelo app instalado. Toque em Compartilhar e depois em Adicionar à Tela de Início.",
            }
          : {
              icon: <Bell size={40} className={styles.iconDefault} />,
              label: "Não ativado",
              statusClass: styles.statusDefault,
              description:
                "Você ainda não recebe notificações neste navegador.",
            };

  return (
    <ModalBase visible={visible} onClose={onClose} title="Notificações">
      <div className={styles.container}>
        <Card>
          <div className={styles.statusRow}>
            {status.icon}
            <div>
              <p className={`${styles.statusLabel} ${status.statusClass}`}>{status.label}</p>
              <p className={styles.statusDescription}>{status.description}</p>
            </div>
          </div>
        </Card>

        <Card title="O que você recebe">
          {BENEFITS.map((text) => (
            <div key={text} className={styles.benefitItem}>
              <span className={styles.bullet} />
              <p className={styles.benefitText}>{text}</p>
            </div>
          ))}
        </Card>

        {(active || canActivate) && (
          <div className={styles.footer}>
            {active ? (
              <Button title="Desativar notificações" onPress={disableNotifications} loading={disabling} />
            ) : (
              <Button title="Ativar notificações" onPress={requestPermission} loading={requesting} />
            )}
          </div>
        )}
      </div>
    </ModalBase>
  );
}
