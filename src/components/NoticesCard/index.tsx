"use client";

import { CoachTarget } from "@/components/CoachTarget";
import { NoticesCardSkeleton } from "@/components/Skeleton/NoticesCardSkeleton";
import { useAuth } from "@/context/AuthContext";
import { useDashboardData } from "@/context/DashboardDataContext";
import { commitmentScheduleLabel, isCommitmentToday } from "@/utils/commitment";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { NoticeBoardModal } from "./NoticeBoardModal";
import styles from "./NoticesCard.module.css";

// Portado de resgatar_app/src/components/NoticesCard. useFocusEffect vira
// leitura do DashboardDataContext, buscado uma única vez por sessão — evita
// refazer a requisição toda vez que a Dashboard remonta ao voltar de outra
// aba. A ação de admin ("Gerenciar Quadro de Avisos") abre o NoticeBoardModal
// (portado de src/screens/NoticeBoardScreen).

export function NoticesCard() {
  const { member } = useAuth();
  const isAdmin = member?.role === "admin";
  const { commitments: items, commitmentsLoading: loading } = useDashboardData();
  const loaded = !loading;
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <CoachTarget id="notices-card">
      <div className={styles.container}>
        <button
          type="button"
          className={styles.header}
          onClick={isAdmin ? () => setModalVisible(true) : undefined}
          disabled={!isAdmin}
          aria-label={isAdmin ? "Gerenciar Quadro de Avisos" : undefined}
        >
          <div className={styles.headerLeft}>
            <span className={styles.headerTitle}>Compromissos da comunidade</span>
          </div>
          {isAdmin && <ChevronRight size={16} color="var(--color-text-muted)" />}
        </button>

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

      <NoticeBoardModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </CoachTarget>
  );
}
