import styles from "./NoticesCardSkeleton.module.css";

// Portado de resgatar_app/src/components/Skeleton/NoticesCardSkeleton.

export function NoticesCardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className={styles.pulse}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={[styles.row, i < rows - 1 && styles.rowBorder].filter(Boolean).join(" ")}>
          <div className={styles.seq} />
          <div className={styles.lines}>
            <div className={styles.lineTitle} />
            <div className={styles.lineMeta} />
          </div>
        </div>
      ))}
    </div>
  );
}
