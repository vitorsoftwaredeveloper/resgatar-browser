import { ILiturgia, LITURGICAL_ACCENT } from "@/types/Liturgy";
import { formatLiturgicalDate } from "@/utils/helper";
import styles from "./LiturgySeasonBanner.module.css";

// Portado de resgatar_app/src/components/LiturgySeasonBanner.

interface Props {
  liturgia: string;
  data: string;
  cor: ILiturgia["cor"];
  tipo?: string;
}

export function LiturgySeasonBanner({ liturgia, data, cor, tipo }: Props) {
  const accent = LITURGICAL_ACCENT[cor];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.label}>LITURGIA DO DIA</span>
        {tipo ? (
          <span
            className={styles.badge}
            style={{ borderColor: accent, color: accent }}
          >
            {tipo.toUpperCase()}
          </span>
        ) : null}
      </div>

      <p className={styles.title}>{liturgia}</p>

      <div className={styles.footer}>
        <span className={styles.date}>{formatLiturgicalDate(data)}</span>
        <span className={styles.dot} style={{ backgroundColor: accent }} />
        <span className={styles.colorName}>{cor}</span>
      </div>
    </div>
  );
}
