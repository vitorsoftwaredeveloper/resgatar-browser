"use client";

import { Header } from "@/components/Header";
import { ItemActionList } from "@/components/ItemActionList";
import { ModalChangePasswordMember } from "@/components/ModalChangePasswordMember";
import { ModalEditMemberData } from "@/components/ModalEditMemberData";
import { ModalRegisterCashPayment } from "@/components/ModalRegisterCashPayment";
import { ModalRemoveMember } from "@/components/ModalRemoveMember";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useAdminHubRedirect } from "@/hooks/useAdminHubRedirect";
import { HandCoins, ShieldCheck, UserRoundMinus, UserRoundPen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./member-actions.module.css";

// Portado de resgatar_app/src/screens/MemberActionsScreen.

export function MemberActionsScreen({ embedded = false }: { embedded?: boolean }) {
  const { colors } = useAppTheme();
  const { isDesktop } = useBreakpoint();

  const [openRemoveMember, setOpenRemoveMember] = useState(false);
  const [openEditMemberData, setOpenEditMemberData] = useState(false);
  const [openCashPayment, setOpenCashPayment] = useState(false);
  const [openChangePassword, setOpenChangePassword] = useState(false);

  const actions = (
    <>
      <ItemActionList
        variant="card"
        title="Remover membro"
        description="Remova um membro impedindo o acesso ao aplicativo."
        onPress={() => setOpenRemoveMember(true)}
        icon={<UserRoundMinus color={colors.primary} />}
      />

      <ItemActionList
        variant="card"
        title="Permissões de membros"
        description="Gerencie quais membros têm acesso de administrador."
        onPress={() => setOpenEditMemberData(true)}
        icon={<ShieldCheck color={colors.primary} />}
      />

      <ItemActionList
        variant="card"
        title="Registrar pagamento em dinheiro"
        description="Confirme o recebimento de uma contribuição paga em dinheiro."
        onPress={() => setOpenCashPayment(true)}
        icon={<HandCoins color={colors.primary} />}
      />

      <ItemActionList
        variant="card"
        title="Atualizar senha de membro"
        description="Atualize a senha de acesso de um membro ao aplicativo."
        onPress={() => setOpenChangePassword(true)}
        icon={<UserRoundPen color={colors.primary} />}
        isLast
      />
    </>
  );

  return (
    <>
      {isDesktop ? (
        <div className={styles.content}>
          <div className={styles.pageHead}>
            <p className="eyebrow">Administrativo</p>
            <h1 className={styles.pageTitle}>Gestão de membros</h1>
          </div>

          <div className={styles.menuCard}>{actions}</div>
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.sectionGroup}>
            {!embedded && <p className={styles.sectionLabel}>Gestão de membros</p>}
            <div className={styles.menuCard}>{actions}</div>
          </div>
        </div>
      )}

      {openRemoveMember && <ModalRemoveMember visible={openRemoveMember} onClose={() => setOpenRemoveMember(false)} />}

      {openEditMemberData && (
        <ModalEditMemberData visible={openEditMemberData} onClose={() => setOpenEditMemberData(false)} />
      )}

      {openCashPayment && (
        <ModalRegisterCashPayment visible={openCashPayment} onClose={() => setOpenCashPayment(false)} />
      )}

      {openChangePassword && (
        <ModalChangePasswordMember visible={openChangePassword} onClose={() => setOpenChangePassword(false)} />
      )}
    </>
  );
}

export default function MemberActionsPage() {
  const { member } = useAuth();
  const router = useRouter();
  // No desktop esta tela vive inline no hub /settings — redireciona pra lá.
  if (useAdminHubRedirect("member-actions")) return null;

  return (
    <div className={`app-shell app-shell--wide ${styles.container}`}>
      <Header
        name={`${member?.firstName ?? ""} ${member?.lastName ?? ""}`}
        photo={member?.profileImage}
        onBack={() => router.back()}
        crumbs={[
          { label: "Administrativo", onClick: () => router.push("/settings") },
          { label: "Gestão de membros" },
        ]}
      />
      <MemberActionsScreen />
    </div>
  );
}
