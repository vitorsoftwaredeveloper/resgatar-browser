import styles from "./RemoveMemberSkeleton.module.css";

// Portado de resgatar_app/src/components/Skeleton/RemoveMemberSkeleton.

export function RemoveMemberSkeleton() {
  return (
    <div className={styles.card}>
      <div className={styles.left}>
        <div className={styles.avatar} />

        <div className={styles.texts}>
          <div className={styles.lineLarge} />
          <div className={styles.lineSmall} />
        </div>
      </div>

      <div className={styles.action} />
    </div>
  );
}
