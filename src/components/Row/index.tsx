import { ReactNode } from "react";
import styles from "./Row.module.css";

// Portado de resgatar_app/src/components/Row.

export function Row({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}
