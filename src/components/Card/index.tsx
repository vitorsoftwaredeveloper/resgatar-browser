import { CSSProperties, ReactNode } from "react";
import styles from "./Card.module.css";

// Portado de resgatar_app/src/components/Card. View/Text viram div/span; mesma
// API de props (title, description, children, style).

type CardProps = {
  title?: string;
  description?: string;
  children?: ReactNode;
  style?: CSSProperties;
};

export const Card = ({ title, description, children, style }: CardProps) => {
  return (
    <div className={styles.card} style={style}>
      {title && <p className={styles.title}>{title}</p>}
      {!!description && <p className={styles.description}>{description}</p>}
      {children}
    </div>
  );
};
