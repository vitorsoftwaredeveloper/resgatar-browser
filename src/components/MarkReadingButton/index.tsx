import { Flame } from "lucide-react";
import styles from "./MarkReadingButton.module.css";

// Portado de resgatar_app/src/components/MarkReadingButton.

interface Props {
  streakCount?: number;
  loading?: boolean;
  onPress: () => void;
}

export function MarkReadingButton({ loading = false, onPress }: Props) {
  return (
    <button
      type="button"
      className={styles.cta}
      onClick={onPress}
      disabled={loading}
      aria-label="Marcar como lida?"
    >
      {loading ? (
        <span className={styles.spinner} />
      ) : (
        <Flame size={15} color="#FFFFFF" />
      )}
      <span className={styles.ctaTitle}>Marcar como lida?</span>
    </button>
  );
}
