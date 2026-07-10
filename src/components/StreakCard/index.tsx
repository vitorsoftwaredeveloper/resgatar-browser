"use client";

import { CoachTarget } from "@/components/CoachTarget";
import { useAuth } from "@/context/AuthContext";
import { IMember } from "@/types/Member";
import { Flame } from "lucide-react";
import { useMemo } from "react";
import { STREAK_ACCENT, STREAK_ACCENT_DIM } from "./constants";
import styles from "./StreakCard.module.css";

// Portado de resgatar_app/src/components/StreakCard.

type ReadingStreak = NonNullable<IMember["readingStreak"]>;

const WEEKDAY_INITIALS = ["D", "S", "T", "Q", "Q", "S", "S"];

interface DayCell {
  initial: string;
  read: boolean;
  isToday: boolean;
}

function buildWeek(streak: ReadingStreak | null | undefined): DayCell[] {
  const cells: DayCell[] = [];
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const current = streak?.currentStreak ?? 0;

  let lastReadDate: Date | null = null;
  if (streak?.lastReadAt) {
    const [y, m, d] = streak.lastReadAt.split("-").map(Number);
    lastReadDate = new Date(y, m - 1, d);
  }

  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const isToday = i === 0;

    let read = false;
    if (lastReadDate && current > 0) {
      const diffFromLastRead = Math.round((lastReadDate.getTime() - d.getTime()) / 86_400_000);
      read = diffFromLastRead >= 0 && diffFromLastRead < current;
    }

    cells.push({ initial: WEEKDAY_INITIALS[d.getDay()], read, isToday });
  }

  return cells;
}

export function StreakCard() {
  const { member } = useAuth();
  const data = member?.readingStreak;

  const week = useMemo(() => buildWeek(data), [data]);

  const current = data?.currentStreak ?? 0;
  const active = current > 0;

  const headline = active
    ? `${current} ${current === 1 ? "dia seguido" : "dias seguidos"}`
    : data
      ? "Retome sua sequência"
      : "Comece sua sequência hoje";

  const recordText = (() => {
    if (!data || data.longestStreak <= 0) return "Abra a liturgia todo dia para evoluir";
    if (!active) return `Recorde: ${data.longestStreak} ${data.longestStreak === 1 ? "dia" : "dias"}`;

    const toRecord = data.longestStreak - current;
    if (toRecord <= 0) return "Você está no seu recorde! 🔥";
    return `Faltam ${toRecord} ${toRecord === 1 ? "dia" : "dias"} para o recorde de ${data.longestStreak}`;
  })();

  return (
    <CoachTarget id="streak-card">
      <div className={styles.container}>
        <span className={styles.label}>OFENSIVA DE LEITURAS</span>

        <div className={styles.row}>
          <div className={styles.left}>
            <div className={[styles.flameWrap, !active && styles.flameWrapDim].filter(Boolean).join(" ")}>
              <Flame
                size={22}
                color={active ? STREAK_ACCENT : STREAK_ACCENT_DIM}
                fill={active ? STREAK_ACCENT : "transparent"}
              />
            </div>
            <div className={styles.texts}>
              <p className={styles.headline}>{headline}</p>
              <p className={styles.subtitle}>{recordText}</p>
            </div>
          </div>

          <div className={styles.right}>
            <div className={styles.week}>
              {week.map((cell, i) => (
                <div key={i} className={styles.dayCol}>
                  <span className={styles.dayInitial}>{cell.initial}</span>
                  <div
                    className={[
                      styles.dot,
                      cell.read && styles.dotRead,
                      cell.isToday && !cell.read && styles.dotToday,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </CoachTarget>
  );
}
