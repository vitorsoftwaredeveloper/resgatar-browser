"use client";

import { Header } from "@/components/Header";
import { ItemActionList } from "@/components/ItemActionList";
import { ModalSendNotification } from "@/components/ModalSendNotification";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { CalendarRange, Gift, Mail, PiggyBank, Receipt, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./settings.module.css";

// Portado de resgatar_app/src/screens/SettingsScreen (área administrativa).

export default function SettingsPage() {
  const { member } = useAuth();
  const { colors } = useAppTheme();
  const router = useRouter();

  const [openSendNotification, setOpenSendNotification] = useState(false);

  return (
    <div className={`app-shell ${styles.container}`}>
      <Header
        name={`${member?.firstName ?? ""} ${member?.lastName ?? ""}`}
        photo={member?.profileImage}
        onBack={() => router.back()}
      />

      <div className={styles.scroll}>
        <div className={styles.content}>
          <div className={styles.sectionGroup}>
            <p className={styles.sectionLabel}>Financeiro</p>
            <div className={styles.menuCard}>
              <ItemActionList
                title="Entrada mensal"
                description="Acompanhe os pagamentos do mês: quem pagou, inadimplentes, total arrecadado e o quanto falta para a meta."
                onPress={() => router.push("/arrecadacao")}
                icon={<PiggyBank color={colors.primary} />}
              />
              <ItemActionList
                title="Balanço anual"
                description="Fechamento do ano: total arrecadado, mês a mês e a situação de cada membro."
                onPress={() => router.push("/balanco-anual")}
                icon={<CalendarRange color={colors.primary} />}
              />
              <ItemActionList
                title="Despesa mensal"
                description="Registre e acompanhe as saídas de caixa do mês por categoria."
                onPress={() => router.push("/expenses")}
                icon={<Receipt color={colors.primary} />}
              />
              <ItemActionList
                title="Listagem de doações"
                description="Veja todas as doações avulsas do ano por membro, valor e forma de pagamento."
                onPress={() => router.push("/donations")}
                icon={<Gift color={colors.primary} />}
                isLast
              />
            </div>
          </div>

          <div className={styles.sectionGroup}>
            <p className={styles.sectionLabel}>Administração</p>
            <div className={styles.menuCard}>
              <ItemActionList
                title="Gestão de membros"
                description="Remova membros, gerencie permissões, registre pagamentos e atualize senhas."
                onPress={() => router.push("/member-actions")}
                icon={<UsersRound color={colors.primary} />}
              />
              <ItemActionList
                title="Enviar notificação"
                description="Envie notificações para os membros da comunidade"
                onPress={() => setOpenSendNotification(true)}
                icon={<Mail color={colors.primary} />}
                isLast
              />
            </div>
          </div>
        </div>
      </div>

      {openSendNotification && (
        <ModalSendNotification visible={openSendNotification} onClose={() => setOpenSendNotification(false)} />
      )}
    </div>
  );
}
