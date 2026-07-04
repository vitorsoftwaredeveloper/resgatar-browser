"use client";

import { useEffect } from "react";
import { configureAmplify } from "@/config/amplify";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { BirthdayProvider } from "@/context/BirthdayContext";
import { CoachProvider } from "@/context/CoachContext";
import { CoachOverlay } from "@/components/CoachOverlay";
import { ToastHost } from "@/components/Toast/ToastHost";

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
        <BirthdayProvider>
          <CoachProvider>
            {children}
            <CoachOverlay />
            <ToastHost />
          </CoachProvider>
        </BirthdayProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
