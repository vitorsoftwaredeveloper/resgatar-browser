import { LogoResgatar } from "@/components/Svg/Logo";
import { THEME } from "@/theme";
import styles from "./LoadingScreen.module.css";

// Portado de resgatar_app/src/screens/LoadingScreen. ActivityIndicator vira
// um spinner CSS.

export function LoadingScreen() {
  return (
    <div className={styles.container}>
      <div className={styles.logoContainer}>
        <LogoResgatar color={THEME.COLORS.primary} size={200} />
      </div>
      <div className={styles.spinner} />
    </div>
  );
}
