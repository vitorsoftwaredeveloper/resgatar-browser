"use client";

import { LoadingScreen } from "@/components/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Bloqueia a renderização de rotas autenticadas até a sessão ser confirmada.
// Mesma checagem usada em (tabs)/layout.tsx, extraída para reuso nas rotas
// administrativas fora do grupo (tabs) — settings, arrecadacao, videos etc.

export function AuthGuard({ children }: { children: React.ReactNode }) {
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

  return <>{children}</>;
}
