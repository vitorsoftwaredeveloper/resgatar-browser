"use client";

import { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Button } from "../Button";
import styles from "./Dialog.module.css";

// Portado de resgatar_app/src/components/Dialog. Modal fade centralizado.

type DialogAction = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
};

type DialogProps = {
  visible: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  actions?: DialogAction[];
};

export function Dialog({ visible, title, description, onClose, actions = [] }: DialogProps) {
  if (!visible) return null;

  // Portal para document.body: alguns pais (ex. Sidebar) usam backdrop-filter,
  // que cria um containing block para position: fixed e prende o overlay
  // dentro do próprio pai em vez de cobrir a viewport inteira.
  return createPortal(
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        {title && <p className={styles.title}>{title}</p>}
        {description && <p className={styles.description}>{description}</p>}

        <div className={styles.actions}>
          {actions.map((action, index) => {
            const buttonStyle: CSSProperties = {
              paddingBlock: 10,
              paddingInline: 18,
              borderRadius: 12,
              width: 110,
              background: action.variant === "secondary" ? "var(--color-muted)" : undefined,
            };
            return (
              <Button
                key={index}
                title={action.label}
                onPress={action.onPress}
                variant={action.variant === "secondary" ? "secondary" : "primary"}
                style={buttonStyle}
              />
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
