"use client";

import { CoachTarget } from "@/components/CoachTarget";
import { useCoach } from "@/context/CoachContext";
import { useAppTheme } from "@/context/ThemeContext";
import { LogOutIcon, Moon, Sun } from "lucide-react";
import { CSSProperties } from "react";
import { createPortal } from "react-dom";
import styles from "./QuickActionsSheet.module.css";

// Portado de resgatar_app/src/components/QuickActionsSheet. O Modal
// transparente ancorado vira um dropdown fixed posicionado por anchorPosition
// (já medida pelo chamador via getBoundingClientRect). Portado para
// document.body porque alguns pais (ex. Sidebar) usam backdrop-filter, que
// cria um containing block para position: fixed e prenderia o dropdown.

interface Props {
  visible: boolean;
  onClose: () => void;
  onLogout?: () => void;
  anchorPosition?: { top?: number; bottom?: number; left?: number; right?: number };
}

export function QuickActionsSheet({
  visible,
  onClose,
  onLogout,
  anchorPosition,
}: Props) {
  const { mode, toggleTheme, colors } = useAppTheme();
  const { active: tutorialActive } = useCoach();

  function handleTheme() {
    toggleTheme();
    onClose();
  }

  function handleLogout() {
    onClose();
    onLogout?.();
  }

  if (!visible) return null;

  const dropdownStyle: CSSProperties = anchorPosition ?? {};

  return createPortal(
    <>
      <div
        className={styles.overlayBackdrop}
        onClick={!tutorialActive ? onClose : undefined}
      />

      <div className={styles.dropdown} style={dropdownStyle}>
        <CoachTarget id="quick-darkmode">
          <button type="button" className={styles.item} onClick={handleTheme}>
            <span className={styles.itemIcon}>
              {mode === "dark" ? <Sun size={16} color={colors.primary} /> : <Moon size={16} color={colors.primary} />}
            </span>
            <span className={styles.itemLabel}>{mode === "dark" ? "Modo claro" : "Modo escuro"}</span>
          </button>
        </CoachTarget>

        {onLogout && (
          <>
            <div className={styles.divider} />
            <button type="button" className={styles.item} onClick={handleLogout}>
              <span className={styles.itemIcon}>
                <LogOutIcon size={16} color={colors.error} style={{ transform: "rotate(180deg)" }} />
              </span>
              <span className={styles.itemLabel} style={{ color: colors.error }}>
                Sair da conta
              </span>
            </button>
          </>
        )}
      </div>
    </>,
    document.body
  );
}
