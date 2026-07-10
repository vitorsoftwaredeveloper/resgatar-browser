"use client";

import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import styles from "./SidebarFrame.module.css";

// Envolve páginas fora do grupo (tabs) que também devem exibir a sidebar no
// desktop (Administrativo, Vídeos, Configurações pessoais). No mobile é um
// passthrough — a página continua em tela cheia com botão de voltar.

export function SidebarFrame({ children }: { children: React.ReactNode }) {
  const { isDesktop } = useBreakpoint();

  return (
    <>
      {isDesktop && <Sidebar />}
      <div className={styles.main}>
        {isDesktop && <Topbar />}
        <div className={styles.frame}>{children}</div>
      </div>
    </>
  );
}
