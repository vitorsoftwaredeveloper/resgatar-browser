"use client";

import { useAppTheme } from "@/context/ThemeContext";
import { X } from "lucide-react";
import { useEffect } from "react";
import styles from "./ModalBase.module.css";

// Portado de resgatar_app/src/components/ModalBase. O Modal nativo (slide de
// baixo pra cima, overFullScreen) vira um bottom sheet fixo no web: overlay +
// sheet animados via CSS, fecha ao clicar no backdrop ou apertar Esc, e trava o
// scroll do body enquanto aberto. O Toast do app (react-native-toast-message)
// ainda não foi portado para web, por isso não é renderizado aqui.

interface IModalBase {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const ModalBase: React.FC<IModalBase> = ({
  visible,
  title,
  onClose,
  children,
}) => {
  const { colors } = useAppTheme();

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.sheet} role="dialog" aria-modal="true">
        {title && (
          <div className={styles.header}>
            <div className={styles.handle} />
            <div className={styles.headerRow}>
              <span className={styles.headerTitle}>{title}</span>
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Fechar"
              >
                <X size={16} color={colors.textMuted} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
};
