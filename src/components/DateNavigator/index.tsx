"use client";

import { CoachTarget } from "@/components/CoachTarget";
import { useAppTheme } from "@/context/ThemeContext";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import styles from "./DateNavigator.module.css";

// Portado de resgatar_app/src/components/DateNavigator.

const WEEK_ABBR = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatCenterLabel(date: Date): string {
  const label = date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

interface Props {
  selectedDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onOpenCalendar: () => void;
  onBackToToday: () => void;
}

export function DateNavigator({ selectedDate, onPrev, onNext, onOpenCalendar, onBackToToday }: Props) {
  const { colors } = useAppTheme();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = isSameDay(selectedDate, today);

  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  return (
    <div className={styles.wrapper}>
      <div className={styles.navRow}>
        <button type="button" className={styles.arrowBtn} onClick={onPrev}>
          <ChevronLeft size={20} color={colors.text} />
        </button>

        <CoachTarget id="dashboard-date" className={styles.centerTarget}>
          <button type="button" className={styles.centerBtn} onClick={onOpenCalendar}>
            <span className={styles.centerText}>{formatCenterLabel(selectedDate)}</span>
          </button>
        </CoachTarget>

        <button type="button" className={styles.arrowBtn} onClick={onNext}>
          <ChevronRight size={20} color={colors.text} />
        </button>
      </div>

      <div className={styles.weekRow}>
        {weekDays.map((day, i) => {
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDay = isSameDay(day, today);
          return (
            <button
              key={i}
              type="button"
              className={[styles.dayCell, isSelected && styles.dayCellSelected].filter(Boolean).join(" ")}
              onClick={() => {
                const diff = Math.round((day.getTime() - selectedDate.getTime()) / 86400000);
                if (diff < 0) for (let j = 0; j < Math.abs(diff); j++) onPrev();
                else if (diff > 0) for (let j = 0; j < diff; j++) onNext();
              }}
            >
              <span className={[styles.dayAbbr, isSelected && styles.dayAbbrSelected].filter(Boolean).join(" ")}>
                {WEEK_ABBR[i]}
              </span>
              <span
                className={[
                  styles.dayNum,
                  isSelected && styles.dayNumSelected,
                  isTodayDay && !isSelected && styles.dayNumToday,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {day.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {!isToday && (
        <button type="button" className={styles.backToToday} onClick={onBackToToday}>
          <Clock size={13} color={colors.primary} />
          <span className={styles.backToTodayText}>Voltar para hoje</span>
        </button>
      )}
    </div>
  );
}
