"use client";

import { ArrecadacaoScreen } from "@/app/arrecadacao/page";
import { BalancoAnualScreen } from "@/app/balanco-anual/page";
import { DonationsScreen } from "@/app/donations/page";
import { ExpensesScreen } from "@/app/expenses/page";
import { MemberActionsScreen } from "@/app/member-actions/page";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Header } from "@/components/Header";
import { ItemActionList } from "@/components/ItemActionList";
import { ModalSendNotification } from "@/components/ModalSendNotification";
import { SidebarFrame } from "@/components/SidebarFrame";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { CalendarRange, Gift, Mail, PiggyBank, Receipt, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import styles from "./settings.module.css";

// Portado de resgatar_app/src/screens/SettingsScreen (área administrativa).
//
// No mobile continua sendo um menu que navega para telas cheias. No desktop
// vira um master-detail: os grupos "Financeiro" e "Administração" se unem num
// único grid e, ao escolher uma opção, a tela-alvo é renderizada no lugar dos
// itens (sem trocar de rota), com um breadcrumb que volta para a lista.

type AdminSection = "Financeiro" | "Administração";

type AdminItem = {
  key: string;
  title: string;
  description: string;
  icon: ReactNode;
  section: AdminSection;
} & ({ kind: "screen"; route: string; render: () => ReactNode } | { kind: "modal" });

type AdminScreenItem = Extract<AdminItem, { kind: "screen" }>;

const SECTIONS: AdminSection[] = ["Financeiro", "Administração"];

export default function SettingsPage() {
  const { member } = useAuth();
  const { colors } = useAppTheme();
  const { isDesktop } = useBreakpoint();
  const router = useRouter();

  const [openSendNotification, setOpenSendNotification] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const items: AdminItem[] = [
    {
      key: "arrecadacao",
      title: "Entrada mensal",
      description:
        "Acompanhe os pagamentos do mês: quem pagou, inadimplentes, total arrecadado e o quanto falta para a meta.",
      icon: <PiggyBank color={colors.primary} />,
      section: "Financeiro",
      kind: "screen",
      route: "/arrecadacao",
      render: () => <ArrecadacaoScreen embedded />,
    },
    {
      key: "balanco-anual",
      title: "Balanço anual",
      description: "Fechamento do ano: total arrecadado, mês a mês e a situação de cada membro.",
      icon: <CalendarRange color={colors.primary} />,
      section: "Financeiro",
      kind: "screen",
      route: "/balanco-anual",
      render: () => <BalancoAnualScreen embedded />,
    },
    {
      key: "expenses",
      title: "Despesa mensal",
      description: "Registre e acompanhe as saídas de caixa do mês por categoria.",
      icon: <Receipt color={colors.primary} />,
      section: "Financeiro",
      kind: "screen",
      route: "/expenses",
      render: () => <ExpensesScreen embedded />,
    },
    {
      key: "donations",
      title: "Listagem de doações",
      description: "Veja todas as doações avulsas do ano por membro, valor e forma de pagamento.",
      icon: <Gift color={colors.primary} />,
      section: "Financeiro",
      kind: "screen",
      route: "/donations",
      render: () => <DonationsScreen embedded />,
    },
    {
      key: "member-actions",
      title: "Gestão de membros",
      description: "Remova membros, gerencie permissões, registre pagamentos e atualize senhas.",
      icon: <UsersRound color={colors.primary} />,
      section: "Administração",
      kind: "screen",
      route: "/member-actions",
      render: () => <MemberActionsScreen embedded />,
    },
    {
      key: "send-notification",
      title: "Enviar notificação",
      description: "Envie notificações para os membros da comunidade",
      icon: <Mail color={colors.primary} />,
      section: "Administração",
      kind: "modal",
    },
  ];

  const activeItem = items.find(
    (i): i is AdminScreenItem => i.key === activeKey && i.kind === "screen",
  );

  function handlePress(item: AdminItem) {
    if (item.kind === "modal") {
      setOpenSendNotification(true);
      return;
    }
    if (isDesktop) {
      setActiveKey(item.key);
    } else {
      router.push(item.route);
    }
  }

  const renderItem = (item: AdminItem, isLast: boolean) => (
    <ItemActionList
      key={item.key}
      variant="card"
      title={item.title}
      description={item.description}
      onPress={() => handlePress(item)}
      icon={item.icon}
      isLast={isLast}
    />
  );

  return (
    <SidebarFrame>
      <div className={`app-shell app-shell--wide ${styles.container}`}>
        <Header
          name={`${member?.firstName ?? ""} ${member?.lastName ?? ""}`}
          photo={member?.profileImage}
          onBack={() => router.back()}
        />

        {isDesktop && activeItem ? (
          <div className={styles.detail}>
            <div className={styles.crumb}>
              <Breadcrumb
                items={[
                  { label: "Administrativo", onClick: () => setActiveKey(null) },
                  { label: activeItem.title },
                ]}
              />
            </div>
            {activeItem.render()}
          </div>
        ) : (
          <div className={styles.scroll}>
            <div className={styles.content}>
              {isDesktop ? (
                // Desktop: grid único, sem rótulos de seção.
                <div className={styles.menuCard}>
                  {items.map((item, index) => renderItem(item, index === items.length - 1))}
                </div>
              ) : (
                // Mobile: dois grupos rotulados.
                SECTIONS.map((section) => {
                  const sectionItems = items.filter((i) => i.section === section);
                  return (
                    <div key={section} className={styles.sectionGroup}>
                      <p className={styles.sectionLabel}>{section}</p>
                      <div className={styles.menuCard}>
                        {sectionItems.map((item, index) =>
                          renderItem(item, index === sectionItems.length - 1),
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {openSendNotification && (
          <ModalSendNotification visible={openSendNotification} onClose={() => setOpenSendNotification(false)} />
        )}
      </div>
    </SidebarFrame>
  );
}
