"use client";

import { Breadcrumb } from "@/components/Breadcrumb";
import { useAppTheme } from "@/context/ThemeContext";
import { useTopbar } from "@/context/TopbarContext";
import { Moon, Sun } from "lucide-react";
import styles from "./Topbar.module.css";

// Faixa fixa do desktop (>=1024px), renderizada uma única vez no layout
// compartilhado (TabsLayout/SidebarFrame) — por isso ocupa a largura inteira
// ao lado da Sidebar, em vez de ficar presa ao max-width centralizado do
// conteúdo de cada página (que o Header, embutido em cada página, não
// conseguia estourar). Os itens do breadcrumb vêm do TopbarContext, que cada
// Header de página publica via useEffect.

export function Topbar() {
  const { crumbs } = useTopbar();
  const { colors, mode, toggleTheme } = useAppTheme();

  return (
    <div className={styles.topbar}>
      <Breadcrumb items={crumbs} />
      <div className={styles.spacer} />
      <button
        type="button"
        className={styles.themeButton}
        onClick={toggleTheme}
        aria-label="Alternar tema"
        title="Alternar tema"
      >
        {mode === "dark" ? <Sun size={18} color={colors.primary} /> : <Moon size={18} color={colors.primary} />}
      </button>
    </div>
  );
}
