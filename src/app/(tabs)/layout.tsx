"use client";

import { LoadingScreen } from "@/components/LoadingScreen";
import { TabBar } from "@/components/TabBar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Layout compartilhado pelas 4 abas (Dashboard, Readings, Bills, Profile).
// Equivalente ao BottomTabs do app: renderiza o TabBar fixo no rodapé e
// protege as rotas contra acesso sem sessão/onboarding pendente.

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const { loading, isLoggedIn, needsOnboarding, onboardingChecked } = useAuth();
  const router = useRouter();

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
    <div className="app-shell" style={{ paddingBottom: 72 }}>
      {children}
      <TabBar />
    </div>
  );
}
