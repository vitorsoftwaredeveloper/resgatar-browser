"use client";

import { CoachTarget } from "@/components/CoachTarget";
import { NoticesCardSkeleton } from "@/components/Skeleton/NoticesCardSkeleton";
import { CommitmentService } from "@/services/CommitmentService";
import { ICommitment } from "@/types/Commitment";
import { commitmentScheduleLabel, isCommitmentToday } from "@/utils/commitment";
import { useEffect, useState } from "react";
import styles from "./NoticesCard.module.css";

// Portado de resgatar_app/src/components/NoticesCard. useFocusEffect vira
// useEffect no mount (sem rotas ainda). A ação de admin ("Gerenciar Quadro de
// Avisos") abria o NoticeBoardModal, que vive em src/screens/NoticeBoardScreen
// no app — essa tela ainda não foi portada para o web, então por ora o card
// só lista os compromissos (sem gestão de admin).

export function NoticesCard() {
  const [items, setItems] = useState<ICommitment[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    CommitmentService.list()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoaded(true));
  }, []);

  return (
    <CoachTarget id="notices-card">
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerTitle}>Compromissos da comunidade</span>
          </div>
        </div>

        {!loaded ? (
          <NoticesCardSkeleton />
        ) : items.length === 0 ? (
          <p className={styles.emptyText}>Nenhum compromisso publicado ainda.</p>
        ) : (
          items.map((item, i) => {
            const today = isCommitmentToday(item);
            return (
              <div
                key={item.id}
                className={[
                  styles.row,
                  today ? styles.rowToday : i < items.length - 1 ? styles.rowBorder : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className={styles.texts}>
                  <div className={styles.titleRow}>
                    <span className={[styles.title, today && styles.titleToday].filter(Boolean).join(" ")}>
                      {item.title}
                    </span>
                    {today && (
                      <span className={styles.todayTag}>
                        <span className={styles.todayTagText}>HOJE</span>
                      </span>
                    )}
                  </div>
                  <p className={[styles.date, today && styles.dateToday].filter(Boolean).join(" ")}>
                    {commitmentScheduleLabel(item)} · <span className={styles.timeTag}>{item.time}</span> ·{" "}
                    {item.location}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </CoachTarget>
  );
}
