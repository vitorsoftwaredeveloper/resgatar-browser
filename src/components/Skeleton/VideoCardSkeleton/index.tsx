import styles from "./VideoCardSkeleton.module.css";

// Portado de resgatar_app/src/components/Skeleton/VideoCardSkeleton.

export function VideoCardSkeleton() {
  return (
    <div className={styles.card}>
      <div className={styles.thumb} />
      <div className={styles.infoRow}>
        <div className={styles.avatar} />
        <div className={styles.lines}>
          <div className={styles.lineTitle} />
          <div className={styles.lineAuthor} />
        </div>
      </div>
    </div>
  );
}
