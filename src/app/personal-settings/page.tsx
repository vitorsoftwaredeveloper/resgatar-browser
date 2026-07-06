"use client";

import { Header } from "@/components/Header";
import { ItemActionList } from "@/components/ItemActionList";
import { ModalDeleteAccount } from "@/components/ModalDeleteAccount";
import { ModalEditProfile } from "@/components/ModalEditProfile";
import { ModalUpdatePassword } from "@/components/ModalUpdatePassword";
import { SidebarFrame } from "@/components/SidebarFrame";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { Lock, Trash2, UserRoundCog } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./personal-settings.module.css";

// Portado de resgatar_app/src/screens/PersonalSettingsScreen.

export default function PersonalSettingsPage() {
  const { member } = useAuth();
  const { colors } = useAppTheme();
  const router = useRouter();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);

  return (
    <SidebarFrame>
      <div className={`app-shell app-shell--wide ${styles.container}`}>
        <Header
          name={`${member?.firstName ?? ""} ${member?.lastName ?? ""}`}
          photo={member?.profileImage}
          onBack={() => router.back()}
        />

      <div className={styles.content}>
        <div className={styles.sectionGroup}>
          <p className={styles.sectionLabel}>Configurações pessoais</p>
          <div className={styles.menuCard}>
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
              title="Encerrar conta"
              description="Remova permanentemente sua conta e dados"
              onPress={() => setDeleteAccountVisible(true)}
              icon={<Trash2 color={colors.primary} />}
              isLast
            />
          </div>
        </div>
      </div>

      {editModalVisible && <ModalEditProfile editModalVisible={editModalVisible} onClose={() => setEditModalVisible(false)} />}

      {passwordModalVisible && (
        <ModalUpdatePassword passwordModalVisible={passwordModalVisible} onClose={() => setPasswordModalVisible(false)} />
      )}

        {deleteAccountVisible && <ModalDeleteAccount visible={deleteAccountVisible} onClose={() => setDeleteAccountVisible(false)} />}
      </div>
    </SidebarFrame>
  );
}
