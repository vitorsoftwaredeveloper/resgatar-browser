"use client";

import { LoadingScreen } from "@/components/LoadingScreen";
import { Sidebar } from "@/components/Sidebar";
import { TabBar } from "@/components/TabBar";
import { useAuth } from "@/context/AuthContext";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import styles from "./layout.module.css";

// Layout compartilhado pelas 4 abas (Dashboard, Readings, Bills, Profile).
// Equivalente ao BottomTabs do app: renderiza o TabBar fixo no rodapé (mobile)
// ou a Sidebar fixa à esquerda (desktop, >=1024px) — nunca os dois ao mesmo
// tempo — e protege as rotas contra acesso sem sessão/onboarding pendente.

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const { loading, isLoggedIn, needsOnboarding, onboardingChecked } = useAuth();
  const router = useRouter();
  const { isDesktop } = useBreakpoint();

  useEffect(() => {
    if (loading || (isLoggedIn && !onboardingChecked)) return;
    if (!isLoggedIn) {
      router.replace("/login");
    } else if (needsOnboarding) {
      router.replace("/onboarding");
    }
  }, [loading, isLoggedIn, needsOnboarding, onboardingChecked, router]);

  if (loading || !isLoggedIn || (isLoggedIn && !onboardingChecked) || needsOnboarding) {
    return <LoadingScreen />;
  }

  return (
    <div className={`app-shell ${styles.tabsShell}`} style={{ paddingBottom: isDesktop ? 0 : 72 }}>
      {isDesktop && <Sidebar />}
      <div className={styles.content}>{children}</div>
      {!isDesktop && <TabBar />}
    </div>
  );
}
