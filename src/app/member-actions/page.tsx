"use client";

import { Header } from "@/components/Header";
import { ItemActionList } from "@/components/ItemActionList";
import { ModalChangePasswordMember } from "@/components/ModalChangePasswordMember";
import { ModalEditMemberData } from "@/components/ModalEditMemberData";
import { ModalRegisterCashPayment } from "@/components/ModalRegisterCashPayment";
import { ModalRemoveMember } from "@/components/ModalRemoveMember";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { HandCoins, ShieldCheck, UserRoundMinus, UserRoundPen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./member-actions.module.css";

// Portado de resgatar_app/src/screens/MemberActionsScreen.

export default function MemberActionsPage() {
  const { member } = useAuth();
  const { colors } = useAppTheme();
  const router = useRouter();

  const [openRemoveMember, setOpenRemoveMember] = useState(false);
  const [openEditMemberData, setOpenEditMemberData] = useState(false);
  const [openCashPayment, setOpenCashPayment] = useState(false);
  const [openChangePassword, setOpenChangePassword] = useState(false);

  return (
    <div className={styles.container}>
      <Header
        name={`${member?.firstName ?? ""} ${member?.lastName ?? ""}`}
        photo={member?.profileImage}
        onBack={() => router.back()}
      />

      <div className={styles.content}>
        <div className={styles.sectionGroup}>
          <p className={styles.sectionLabel}>Gestão de membros</p>
          <div className={styles.menuCard}>
            <ItemActionList
              title="Remover membro"
              description="Remova um membro impedindo o acesso ao aplicativo."
              onPress={() => setOpenRemoveMember(true)}
              icon={<UserRoundMinus color={colors.primary} />}
            />

            <ItemActionList
              title="Permissões de membros"
              description="Gerencie quais membros têm acesso de administrador."
              onPress={() => setOpenEditMemberData(true)}
              icon={<ShieldCheck color={colors.primary} />}
            />

            <ItemActionList
              title="Registrar pagamento em dinheiro"
              description="Confirme o recebimento de uma contribuição paga em dinheiro."
              onPress={() => setOpenCashPayment(true)}
              icon={<HandCoins color={colors.primary} />}
            />

            <ItemActionList
              title="Atualizar senha de membro"
              description="Atualize a senha de acesso de um membro ao aplicativo."
              onPress={() => setOpenChangePassword(true)}
              icon={<UserRoundPen color={colors.primary} />}
              isLast
            />
          </div>
        </div>
      </div>

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
    </div>
  );
}
