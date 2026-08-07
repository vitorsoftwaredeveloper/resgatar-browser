"use client";

import { Header } from "@/components/Header";
import { ItemActionList } from "@/components/ItemActionList";
import { ModalDeleteAccount } from "@/components/ModalDeleteAccount";
import { ModalEditProfile } from "@/components/ModalEditProfile";
import { ModalNotificationPermission } from "@/components/ModalNotificationPermission";
import { ModalUpdatePassword } from "@/components/ModalUpdatePassword";
import { SidebarFrame } from "@/components/SidebarFrame";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";
import { Bell, BellOff, BellRing, Lock, Trash2, UserRoundCog } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./personal-settings.module.css";

// Portado de resgatar_app/src/screens/PersonalSettingsScreen.

export default function PersonalSettingsPage() {
  const { member } = useAuth();
  const { colors } = useAppTheme();
  const { isDesktop } = useBreakpoint();
  const router = useRouter();
  const { permission, active } = useNotificationPermission();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);

  const notificationItem = active
    ? {
        title: "Notificações ativadas",
        description: "Você recebe avisos de cobranças e novidades da comunidade neste aparelho.",
        icon: <BellRing color={colors.primary} />,
      }
    : permission === "denied"
      ? {
          title: "Notificações bloqueadas",
          description: "Você bloqueou os avisos. Toque para ver como reativar.",
          icon: <BellOff color={colors.primary} />,
        }
      : {
          title: "Ativar notificações",
          description: "Receba avisos de cobranças, comunicados da comunidade e novidades direto neste aparelho.",
          icon: <Bell color={colors.primary} />,
        };

  const actions = (
    <>
      <ItemActionList
        variant="card"
        title="Meus dados"
        description="Visualize ou edite seus dados pessoais"
        onPress={() => setEditModalVisible(true)}
        icon={<UserRoundCog color={colors.primary} />}
      />

      <ItemActionList
        variant="card"
        title="Atualizar senha"
        description="Atualize sua senha de login do aplicativo"
        onPress={() => setPasswordModalVisible(true)}
        icon={<Lock color={colors.primary} />}
      />

      <ItemActionList
        variant="card"
        title={notificationItem.title}
        description={notificationItem.description}
        onPress={() => setNotificationModalVisible(true)}
        icon={notificationItem.icon}
      />

      <ItemActionList
        variant="card"
        title="Encerrar conta"
        description="Remova permanentemente sua conta e dados"
        onPress={() => setDeleteAccountVisible(true)}
        icon={<Trash2 color={colors.primary} />}
        isLast
      />
    </>
  );

  return (
    <SidebarFrame>
      <div className={`app-shell app-shell--wide ${styles.container}`}>
        <Header
          name={`${member?.firstName ?? ""} ${member?.lastName ?? ""}`}
          photo={member?.profileImage}
          onBack={() => router.back()}
          crumbs={[{ label: "Configurações pessoais" }]}
        />

      {isDesktop ? (
        <div className={styles.content}>
          <div className={styles.pageHead}>
            <p className="eyebrow">Perfil</p>
            <h1 className={styles.pageTitle}>Configurações pessoais</h1>
          </div>

          <div className={styles.menuCard}>{actions}</div>
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.sectionGroup}>
            <p className={styles.sectionLabel}>Configurações pessoais</p>
            <div className={styles.menuCard}>{actions}</div>
          </div>
        </div>
      )}

      {editModalVisible && <ModalEditProfile editModalVisible={editModalVisible} onClose={() => setEditModalVisible(false)} />}

      {passwordModalVisible && (
        <ModalUpdatePassword passwordModalVisible={passwordModalVisible} onClose={() => setPasswordModalVisible(false)} />
      )}

        {deleteAccountVisible && <ModalDeleteAccount visible={deleteAccountVisible} onClose={() => setDeleteAccountVisible(false)} />}

        {notificationModalVisible && (
          <ModalNotificationPermission visible={notificationModalVisible} onClose={() => setNotificationModalVisible(false)} />
        )}
      </div>
    </SidebarFrame>
  );
}
