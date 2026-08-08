"use client";

import { useAuth } from "@/context/AuthContext";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { useNotifications } from "@/context/NotificationsContext";
import { LogoResgatar } from "@/components/Svg/Logo";
import { Bell, Share, X } from "lucide-react";
import { useState } from "react";
import { useClientValue } from "@/hooks/useClientValue";
import { isInAppWebview } from "@/utils/device";
import styles from "./PwaBanners.module.css";

export function PwaBanners() {
  const { isLoggedIn } = useAuth();
  const { isStandalone, isIos, canPromptInstall, promptInstall } =
    usePwaInstall();
  const { permission, active, requesting, requestPermission } =
    useNotifications();

  const [installDismissed, setInstallDismissed] = useState(false);
  const [notificationDismissed, setNotificationDismissed] = useState(false);
  const inAppWebview = useClientValue(isInAppWebview, false);

  const showInstallBanner = !isStandalone && !installDismissed;
  const showWebviewBanner =
    !showInstallBanner && inAppWebview && isLoggedIn && !notificationDismissed;
  const showNotificationBanner =
    !showInstallBanner &&
    !showWebviewBanner &&
    isLoggedIn &&
    !active &&
    permission !== "denied" &&
    permission !== "unsupported" &&
    !notificationDismissed;

  if (showInstallBanner) {
    return (
      <div className={styles.banner}>
        <div className={styles.icon}>
          <LogoResgatar size={50} color="var(--color-primary)" />
        </div>
        <div className={styles.text}>
          <p className={styles.title}>Instale o app Resgatar</p>
          <p className={styles.subtitle}>
            {isIos
              ? "Toque em Compartilhar e depois em Adicionar à Tela de Início."
              : "Acesse mais rápido direto da tela inicial do seu aparelho."}
          </p>
        </div>
        <div className={styles.actions}>
          {!isIos && canPromptInstall && (
            <button
              type="button"
              className={styles.primaryAction}
              onClick={promptInstall}
            >
              Instalar
            </button>
          )}
          {isIos && <Share size={18} color="var(--color-text-muted)" />}
          <button
            type="button"
            className={styles.dismiss}
            onClick={() => setInstallDismissed(true)}
            aria-label="Fechar aviso de instalação"
          >
            <X size={16} color="var(--color-text-muted)" />
          </button>
        </div>
      </div>
    );
  }

  if (showWebviewBanner) {
    return (
      <div className={styles.banner}>
        <div className={styles.icon}>
          <Bell size={20} color="var(--color-primary)" />
        </div>
        <div className={styles.text}>
          <p className={styles.title}>Abra no navegador</p>
          <p className={styles.subtitle}>
            Para receber avisos da comunidade, abra este link no Safari ou no
            Chrome — o app onde você está não permite notificações.
          </p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.dismiss}
            onClick={() => setNotificationDismissed(true)}
            aria-label="Fechar aviso de notificações"
          >
            <X size={16} color="var(--color-text-muted)" />
          </button>
        </div>
      </div>
    );
  }

  if (showNotificationBanner) {
    return (
      <div className={styles.banner}>
        <div className={styles.icon}>
          <Bell size={20} color="var(--color-primary)" />
        </div>
        <div className={styles.text}>
          <p className={styles.title}>Ative as notificações</p>
          <p className={styles.subtitle}>
            Receba avisos de cobranças, avisos da comunidade e novidades.
          </p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryAction}
            onClick={requestPermission}
            disabled={requesting}
          >
            {requesting ? "Ativando..." : "Ativar"}
          </button>
          <button
            type="button"
            className={styles.dismiss}
            onClick={() => setNotificationDismissed(true)}
            aria-label="Fechar aviso de notificações"
          >
            <X size={16} color="var(--color-text-muted)" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
