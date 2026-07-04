"use client";

import { Avatar } from "@/components/Avatar";
import { BirthdayModal } from "@/components/BirthdayModal";
import { CoachTarget } from "@/components/CoachTarget";
import { QuickActionsSheet } from "@/components/QuickActionsSheet";
import { LogoResgatar } from "@/components/Svg/Logo";
import { useBirthday } from "@/context/BirthdayContext";
import { useAppTheme } from "@/context/ThemeContext";
import { resolveAvatarUri } from "@/utils/image";
import { ChevronLeft, EllipsisVertical } from "lucide-react";
import { useRef, useState } from "react";
import styles from "./Header.module.css";

// Portado de resgatar_app/src/components/Header. measure() nativo vira
// getBoundingClientRect. useIsFocused (react-navigation) foi removido — este
// projeto ainda não tem rotas, então não há "tela perdeu foco" para fechar o
// sheet automaticamente.

interface Props {
  name: string;
  photo?: string;
  onBack?: () => void;
}

export function Header({ name, photo, onBack }: Props) {
  const { colors } = useAppTheme();
  const { todayBirthdays } = useBirthday();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [birthdayVisible, setBirthdayVisible] = useState(false);
  const [anchorPosition, setAnchorPosition] = useState<{ top: number; right: number } | undefined>();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const avatarUri = resolveAvatarUri(photo);

  function handleOpenSheet() {
    const node = buttonRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    setAnchorPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setSheetVisible(true);
  }

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        {onBack && (
          <button type="button" onClick={onBack} className={styles.backButton} aria-label="Voltar">
            <ChevronLeft size={22} color={colors.primary} />
          </button>
        )}

        <div className={styles.logo}>
          {avatarUri ? <Avatar photo={photo} size={50} /> : <LogoResgatar size={100} color={colors.primary} />}
        </div>
        <div className={styles.textContainer}>
          <p className={styles.hello}>Olá,</p>
          <p className={styles.name}>{name}</p>
        </div>
        <CoachTarget id="header-quickactions">
          <button
            ref={buttonRef}
            type="button"
            aria-label="Ações rápidas"
            onClick={handleOpenSheet}
            className={styles.themeToggle}
          >
            <EllipsisVertical size={18} color={colors.primary} />
            {todayBirthdays > 0 && (
              <span className={styles.badge}>
                <span className={styles.badgeText}>{todayBirthdays}</span>
              </span>
            )}
          </button>
        </CoachTarget>
      </div>

      <QuickActionsSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onOpenBirthdays={() => setBirthdayVisible(true)}
        anchorPosition={anchorPosition}
        todayBirthdays={todayBirthdays}
      />

      <BirthdayModal visible={birthdayVisible} onClose={() => setBirthdayVisible(false)} />
    </div>
  );
}
