"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { Sidebar } from "@/components/Sidebar";
import { TabBar } from "@/components/TabBar";
import { Topbar } from "@/components/Topbar";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import styles from "./layout.module.css";

// Layout compartilhado pelas 4 abas (Dashboard, Readings, Bills, Profile).
// Equivalente ao BottomTabs do app: renderiza o TabBar fixo no rodapé (mobile)
// ou a Sidebar fixa à esquerda (desktop, >=1024px) — nunca os dois ao mesmo
// tempo. A proteção contra acesso sem sessão/onboarding pendente vem do
// AuthGuard.

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const { isDesktop } = useBreakpoint();

  return (
    <AuthGuard>
      <div className={`app-shell ${styles.tabsShell}`} style={{ paddingBottom: isDesktop ? 0 : 72 }}>
        {isDesktop && <Sidebar />}
        <div className={styles.main}>
          {isDesktop && <Topbar />}
          <div className={styles.content}>{children}</div>
        </div>
        {!isDesktop && <TabBar />}
      </div>
    </AuthGuard>
  );
}
