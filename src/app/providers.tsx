"use client";

import { useEffect } from "react";
import { configureAmplify } from "@/config/amplify";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { BirthdayProvider } from "@/context/BirthdayContext";
import { ChargeProvider } from "@/context/ChargeContext";
import { DashboardDataProvider } from "@/context/DashboardDataContext";
import { DashboardVisibilityProvider } from "@/context/DashboardVisibilityContext";
import { TopbarProvider } from "@/context/TopbarContext";
import { ToastHost } from "@/components/Toast/ToastHost";
import { PwaBanners } from "@/components/PwaBanners";

// Providers globais da aplicação. Configura o Amplify no cliente antes de
// qualquer chamada de auth e disponibiliza Theme + Auth para toda a árvore.

configureAmplify();

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    configureAmplify();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <ChargeProvider>
          <DashboardVisibilityProvider>
            <BirthdayProvider>
              <DashboardDataProvider>
                <TopbarProvider>
                  {children}
                  <ToastHost />
                  <PwaBanners />
                </TopbarProvider>
              </DashboardDataProvider>
            </BirthdayProvider>
          </DashboardVisibilityProvider>
        </ChargeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
