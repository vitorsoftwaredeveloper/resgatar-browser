import { ReactNode } from "react";
import styles from "./ItemActionList.module.css";

// Portado de resgatar_app/src/components/ItemActionList.

interface Props {
  title: string;
  description: string;
  onPress: () => void;
  isLast?: boolean;
  icon?: ReactNode;
  // "card" reorganiza o item como card (só no desktop) — ícone no topo, título,
  // descrição e hover. No mobile continua sendo uma linha de lista.
  variant?: "list" | "card";
}

export function ItemActionList({ title, description, onPress, isLast, icon, variant = "list" }: Props) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={[styles.container, variant === "card" && styles.cardVariant].filter(Boolean).join(" ")}
    >
      <div className={styles.row}>
        <div className={styles.icon}>{icon}</div>

        <div className={styles.center}>
          <p className={styles.title}>{title}</p>
          <p className={styles.description}>{description}</p>
        </div>

        <span className={styles.arrow}>›</span>
      </div>

      {!isLast && <div className={styles.divider} />}
    </button>
  );
}
