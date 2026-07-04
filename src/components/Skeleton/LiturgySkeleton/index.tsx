import styles from "./LiturgySkeleton.module.css";

// Portado de resgatar_app/src/components/Skeleton/LiturgySkeleton. A opacidade
// pulsante via reanimated (withRepeat/withTiming) vira uma animação CSS.

export function LiturgySkeleton() {
  return (
    <div className={styles.pulse}>
      <div className={styles.banner} />
      <div className={styles.card} />
      <div className={styles.cardSmall} />
      <div className={styles.cardTall} />
      <div className={styles.card} />
    </div>
  );
}
