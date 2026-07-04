import styles from "./CommunityGoalCardSkeleton.module.css";

// Portado de resgatar_app/src/components/Skeleton/CommunityGoalCardSkeleton.
// Placeholder animado (pulse) enquanto o andamento das contribuições carrega.

export function CommunityGoalCardSkeleton() {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.icon} />
        <div className={styles.title} />
      </div>
      <div className={styles.percent} />
      <div className={styles.track} />
    </div>
  );
}
