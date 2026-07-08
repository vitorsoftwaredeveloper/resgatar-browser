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
import { BalanceServices } from "@/services/BalanceService";
import { ChargeServices } from "@/services/ChargeService";
import { IMember } from "@/types/Member";
import { formatMoneyBRL } from "@/utils/helper";
import {
  CalendarRange,
  CircleAlert,
  Gift,
  Mail,
  PiggyBank,
  Receipt,
  Target,
  UsersRound,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import styles from "./settings.module.css";

const MONTH_LABELS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

interface AdminKpis {
  saldoEmCaixa: number;
  metaPercent: number;
  metaCollected: number;
  metaGoal: number;
  inadimplentes: number;
  membrosAtivos: number;
}

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
  const { member, listMembers } = useAuth();
  const { colors } = useAppTheme();
  const { isDesktop } = useBreakpoint();
  const router = useRouter();

  const [kpis, setKpis] = useState<AdminKpis | null>(null);

  // KPIs do hub (saldo em caixa, meta anual, inadimplentes, membros ativos) —
  // só fazem sentido no layout desktop (o mobile continua o menu simples),
  // então só busca quando a sidebar/hub em grade está de fato visível.
  useEffect(() => {
    if (!isDesktop) return;
    let cancelled = false;
    const now = new Date();
    const year = now.getFullYear();

    Promise.allSettled([
      BalanceServices.getAnnual(year),
      ChargeServices.getAnnualSummary(year),
      ChargeServices.getSummary(year, now.getMonth() + 1),
      listMembers(),
    ]).then(([balanceR, annualR, monthR, membersR]) => {
      if (cancelled) return;
      setKpis({
        saldoEmCaixa: balanceR.status === "fulfilled" ? balanceR.value.totals.saldoFinal : 0,
        metaPercent: annualR.status === "fulfilled" ? annualR.value.totals.percent : 0,
        metaCollected: annualR.status === "fulfilled" ? annualR.value.totals.collected : 0,
        metaGoal: annualR.status === "fulfilled" ? annualR.value.totals.goal : 0,
        inadimplentes: monthR.status === "fulfilled" ? monthR.value.counts.pending : 0,
        membrosAtivos:
          membersR.status === "fulfilled"
            ? (membersR.value as unknown as IMember[]).length
            : 0,
      });
    });

    return () => {
      cancelled = true;
    };
    // listMembers não é memoizado no AuthContext (nova referência a cada
    // render do provider) — se entrasse nas deps, o efeito dispararia de novo
    // a cada re-render do AuthProvider, não só quando isDesktop mudasse.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop]);

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
                <>
                  <div className={styles.pageHead}>
                    <p className="eyebrow">Painel de gestão</p>
                    <h1 className={styles.pageTitle}>Administrativo</h1>
                    <p className={styles.pageSubtitle}>
                      Visão financeira e ferramentas de gestão da Comunidade Resgatar.
                    </p>
                  </div>

                  <div className={styles.kpiGrid}>
                    <div className="tile tile-accent">
                      <div className="t-top">
                        <span className="t-ic">
                          <Wallet size={17} />
                        </span>
                        Saldo em caixa
                      </div>
                      <div className="t-val money">
                        {kpis ? formatMoneyBRL(kpis.saldoEmCaixa) : "—"}
                      </div>
                      <div className="t-sub">Entradas − saídas · {new Date().getFullYear()}</div>
                    </div>

                    <div className="tile">
                      <div className="t-top">
                        <span className="t-ic">
                          <Target size={17} />
                        </span>
                        Meta anual
                      </div>
                      <div className="t-val">{kpis ? `${Math.round(kpis.metaPercent)}%` : "—"}</div>
                      <div className="t-sub">
                        {kpis
                          ? `${formatMoneyBRL(kpis.metaCollected)} de ${formatMoneyBRL(kpis.metaGoal)}`
                          : "Carregando..."}
                      </div>
                    </div>

                    <div className="tile">
                      <div className="t-top">
                        <span
                          className="t-ic"
                          style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
                        >
                          <CircleAlert size={17} />
                        </span>
                        Inadimplentes
                      </div>
                      <div className="t-val">{kpis ? kpis.inadimplentes : "—"}</div>
                      <div className="t-sub">no mês de {MONTH_LABELS[new Date().getMonth()]}</div>
                    </div>

                    <div className="tile">
                      <div className="t-top">
                        <span className="t-ic">
                          <UsersRound size={17} />
                        </span>
                        Membros ativos
                      </div>
                      <div className="t-val">{kpis ? kpis.membrosAtivos : "—"}</div>
                      <div className="t-sub">na comunidade</div>
                    </div>
                  </div>

                  <div className={styles.toolsSectionHead}>
                    <h2>Ferramentas</h2>
                  </div>

                  <div className={styles.menuCard}>
                    {items.map((item, index) => renderItem(item, index === items.length - 1))}
                  </div>
                </>
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
