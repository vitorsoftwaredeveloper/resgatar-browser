"use client";

import { useAppTheme } from "@/context/ThemeContext";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useState } from "react";
import styles from "./CalendarModal.module.css";

// Portado de resgatar_app/src/components/CalendarModal. Animated.Value vira
// CSS transition (translateY via montagem condicional).

const WEEK_HEADER = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildCalendarGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const grid: (Date | null)[] = [];

  for (let i = 0; i < firstDay.getDay(); i++) {
    const d = new Date(year, month, -firstDay.getDay() + i + 1);
    grid.push(d);
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    grid.push(new Date(year, month, d));
  }
  const remaining = 7 - (grid.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      grid.push(new Date(year, month + 1, d));
    }
  }
  return grid;
}

interface Props {
  visible: boolean;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}

export function CalendarModal({ visible, selectedDate, onSelectDate, onClose }: Props) {
  const { colors } = useAppTheme();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  if (!visible) return null;

  const grid = buildCalendarGrid(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const handleSelectDay = (date: Date) => {
    onSelectDate(new Date(date));
    onClose();
  };

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.handle} />

        <div className={styles.monthHeader}>
          <button type="button" className={styles.monthArrow} onClick={prevMonth}>
            <ChevronLeft size={18} color={colors.text} />
          </button>
          <span className={styles.monthTitle}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button type="button" className={styles.monthArrow} onClick={nextMonth}>
            <ChevronRight size={18} color={colors.text} />
          </button>
        </div>

        <div className={styles.weekHeader}>
          {WEEK_HEADER.map((d, i) => (
            <span key={i} className={styles.weekHeaderText}>
              {d}
            </span>
          ))}
        </div>

        <div className={styles.grid}>
          {grid.map((date, i) => {
            if (!date) return <div key={i} className={styles.gridCell} />;
            const isCurrentMonth = date.getMonth() === viewMonth;
            const isSelected = isSameDay(date, selectedDate);
            const isTodayDate = isSameDay(date, today);
            return (
              <button
                key={i}
                type="button"
                className={styles.gridCell}
                onClick={() => handleSelectDay(date)}
                disabled={!isCurrentMonth}
              >
                <div
                  className={[
                    styles.dayCircle,
                    isSelected && styles.dayCircleSelected,
                    isTodayDate && !isSelected && styles.dayCircleToday,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span
                    className={[
                      styles.dayText,
                      !isCurrentMonth && styles.dayTextOtherMonth,
                      isSelected && styles.dayTextSelected,
                      isTodayDate && !isSelected && styles.dayTextToday,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {date.getDate()}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.todayBtn} onClick={() => handleSelectDay(today)}>
            <Clock size={14} color={colors.primary} />
            <span className={styles.todayBtnText}>Hoje</span>
          </button>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <span className={styles.closeBtnText}>Fechar</span>
          </button>
        </div>
      </div>
    </>
  );
}
