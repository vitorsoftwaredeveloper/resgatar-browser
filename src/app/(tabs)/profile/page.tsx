"use client";

import { CoachTarget } from "@/components/CoachTarget";
import { Dialog } from "@/components/Dialog";
import { Header } from "@/components/Header";
import { ItemActionList } from "@/components/ItemActionList";
import { ModalEditPhoto } from "@/components/ModalEditPhoto";
import { ProfileHeaderCard } from "@/components/ProfileHeaderCard";
import { useAppTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { IMember } from "@/types/Member";
import { HelpCircle, LogOut, Settings, ShieldUser, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./profile.module.css";

// Portado de resgatar_app/src/screens/ProfileScreen. useBottomTabBarHeight()
// não é necessário no web: o padding-bottom do rodapé já vem do TabsLayout.

export default function ProfilePage() {
  const { logout, member, restartOnboarding } = useAuth();
  const { colors } = useAppTheme();
  const { isDesktop } = useBreakpoint();
  const router = useRouter();
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [dialogLogoutVisible, setDialogLogoutVisible] = useState(false);

  // "Mais" é uma aba só do mobile (TabBar). No desktop a sidebar já expõe todos
  // esses itens, então essa tela não tem lugar — redireciona para Configurações
  // pessoais, o destino mais próximo do "meu perfil".
  useEffect(() => {
    if (isDesktop) router.replace("/personal-settings");
  }, [isDesktop, router]);

  const handleLogout = async () => {
    await logout();
    setDialogLogoutVisible(false);
  };

  // Evita o flash da tela mobile no desktop enquanto o replace acima acontece.
  if (isDesktop) return null;

  return (
    <div className={styles.container}>
      <Header
        name={`${member?.firstName ?? ""} ${member?.lastName ?? ""}`}
        photo={member?.profileImage}
        crumbs={[{ label: "Mais" }]}
      />

      <div className={styles.content}>
        <ProfileHeaderCard member={member as IMember} onPressAvatar={() => setPhotoModalVisible(true)} />

        <div className={styles.menuCard}>
          {member?.role === "admin" && (
            <ItemActionList
              title="Administrativo"
              description="Financeiro, membros e notificações da comunidade"
              onPress={() => router.push("/settings")}
              icon={<ShieldUser color={colors.primary} />}
            />
          )}

          <CoachTarget id="profile-personal-settings">
            <ItemActionList
              title="Configurações pessoais"
              description="Dados, senha e encerramento de conta"
              onPress={() => router.push("/personal-settings")}
              icon={<Settings color={colors.primary} />}
            />
          </CoachTarget>

          <CoachTarget id="profile-videos">
            <ItemActionList
              title="Vídeos"
              description="Veja os vídeos publicados pelos membros"
              onPress={() => router.push("/videos")}
              icon={<Video color={colors.primary} />}
            />
          </CoachTarget>

          <ItemActionList
            title="Rever tutorial"
            description="Veja novamente a apresentação do aplicativo"
            onPress={restartOnboarding}
            icon={<HelpCircle color={colors.primary} />}
            isLast
          />
        </div>

        <button type="button" className={styles.logout} onClick={() => setDialogLogoutVisible(true)}>
          <LogOut color={colors.error} />
          <span className={styles.logoutText}>Sair da conta</span>
        </button>

        {photoModalVisible && (
          <ModalEditPhoto visible={photoModalVisible} onClose={() => setPhotoModalVisible(false)} />
        )}

        <Dialog
          visible={dialogLogoutVisible}
          title="Tem certeza que deseja sair?"
          description="Você pode realizar o login novamente e ter acesso a todas as funcionalidades do nosso aplicativo."
          onClose={() => setDialogLogoutVisible(false)}
          actions={[
            {
              label: "cancelar",
              onPress: () => setDialogLogoutVisible(false),
              variant: "secondary",
            },
            {
              label: "sair",
              onPress: handleLogout,
              variant: "primary",
            },
          ]}
        />
      </div>
    </div>
  );
}
