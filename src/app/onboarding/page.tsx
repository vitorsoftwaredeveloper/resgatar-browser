"use client";

import { Button } from "@/components/Button";
import { LoadingScreen } from "@/components/LoadingScreen";
import { LogoResgatar } from "@/components/Svg/Logo";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Placeholder funcional do OnboardingScreen: o carrossel completo do app
// ainda não foi portado, mas o fluxo de navegação (completar onboarding e
// seguir para o dashboard) já funciona de ponta a ponta.

export default function OnboardingPage() {
  const { loading, isLoggedIn, needsOnboarding, onboardingChecked, completeOnboarding } = useAuth();
  const { colors } = useAppTheme();
  const router = useRouter();

  useEffect(() => {
    if (loading || (isLoggedIn && !onboardingChecked)) return;
    if (!isLoggedIn) {
      router.replace("/login");
    } else if (!needsOnboarding) {
      router.replace("/dashboard");
    }
  }, [loading, isLoggedIn, needsOnboarding, onboardingChecked, router]);

  if (loading || !isLoggedIn || !onboardingChecked || !needsOnboarding) {
    return <LoadingScreen />;
  }

  return (
    <div className="app-shell" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100dvh", padding: 24, gap: 24, textAlign: "center" }}>
      <LogoResgatar color={colors.primary} size={160} />
      <h1 style={{ fontSize: "var(--font-title)", color: "var(--color-text-strong)" }}>Bem-vindo(a) à Comunidade Resgatar</h1>
      <p style={{ color: "var(--color-text-muted)" }}>
        O tour de boas-vindas completo ainda está sendo portado para a web. Por enquanto, vamos direto ao painel.
      </p>
      <Button
        title="Continuar"
        onPress={async () => {
          await completeOnboarding();
          router.replace("/dashboard");
        }}
      />
    </div>
  );
}
