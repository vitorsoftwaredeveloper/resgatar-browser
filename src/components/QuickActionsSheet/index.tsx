"use client";

import { BirthdayModal } from "@/components/BirthdayModal";
import { CoachTarget } from "@/components/CoachTarget";
import { useCoach } from "@/context/CoachContext";
import { useAppTheme } from "@/context/ThemeContext";
import { Cake, Moon, Sun } from "lucide-react";
import { CSSProperties, useState } from "react";
import styles from "./QuickActionsSheet.module.css";

// Portado de resgatar_app/src/components/QuickActionsSheet. O Modal
// transparente ancorado vira um dropdown fixed posicionado por anchorPosition
// (já medida pelo Header via getBoundingClientRect).

interface Props {
  visible: boolean;
  onClose: () => void;
  anchorPosition?: { top: number; right: number };
  todayBirthdays?: number;
}

export function QuickActionsSheet({ visible, onClose, anchorPosition, todayBirthdays = 0 }: Props) {
  const { mode, toggleTheme, colors } = useAppTheme();
  const { active: tutorialActive } = useCoach();
  const [birthdayVisible, setBirthdayVisible] = useState(false);

  function handleTheme() {
    toggleTheme();
    onClose();
  }

  function handleBirthdays() {
    onClose();
    setBirthdayVisible(true);
  }

  if (!visible) return null;

  const dropdownStyle: CSSProperties = anchorPosition
    ? { top: anchorPosition.top, right: anchorPosition.right }
    : {};

  return (
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

        <div className={styles.divider} />

        <CoachTarget id="quick-birthdays">
          <button type="button" className={styles.item} onClick={handleBirthdays}>
            <span className={styles.itemIcon}>
              <Cake size={16} color={colors.primary} />
            </span>
            <span className={styles.itemLabel}>Aniversariantes</span>
            {todayBirthdays > 0 && (
              <span className={styles.badge}>
                <span className={styles.badgeText}>{todayBirthdays}</span>
              </span>
            )}
          </button>
        </CoachTarget>
      </div>

      <BirthdayModal visible={birthdayVisible} onClose={() => setBirthdayVisible(false)} />
    </>
  );
}
