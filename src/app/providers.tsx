"use client";

import { useEffect } from "react";
import { configureAmplify } from "@/config/amplify";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";

// Providers globais da aplicação. Configura o Amplify no cliente antes de
// qualquer chamada de auth e disponibiliza Theme + Auth para toda a árvore.

configureAmplify();

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    configureAmplify();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
