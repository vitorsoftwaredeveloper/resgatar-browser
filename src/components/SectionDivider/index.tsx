import { ReactNode } from "react";
import styles from "./SectionDivider.module.css";

// Portado de resgatar_app/src/components/SectionDivider.

interface Props {
  title: string;
  icon?: ReactNode;
}

export function SectionDivider({ title, icon }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.line} />
      <div className={styles.center}>
        {icon}
        <span className={styles.title}>{title}</span>
      </div>
      <div className={styles.line} />
    </div>
  );
}
