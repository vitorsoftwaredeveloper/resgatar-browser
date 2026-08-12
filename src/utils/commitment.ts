import { CommitmentOrdinal, ICommitment } from "@/types/Commitment";

// Portado de resgatar_app/src/utils/commitment.ts (idêntico — JS puro).

const WEEKDAY_LONG = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export const WEEKDAY_OPTIONS = WEEKDAY_LONG.map((label, value) => ({
  label,
  value,
}));

export const ORDINAL_OPTIONS: { label: string; value: CommitmentOrdinal }[] = [
  { label: "1º", value: 1 },
  { label: "2º", value: 2 },
  { label: "3º", value: 3 },
  { label: "4º", value: 4 },
  { label: "5º", value: 5 },
  { label: "Último", value: "last" },
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

type ScheduleFields = Pick<ICommitment, "repeat" | "day" | "date">;

interface CalendarDay {
  year: number;
  month: number;
  day: number;
}

export function commitmentCalendarDay(date: string): CalendarDay {
  const d = new Date(date);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    day: d.getUTCDate(),
  };
}

export function commitmentScheduleLabel(c: ScheduleFields): string {
  if (c.repeat === "weekly") return `Toda ${c.day}`;
  if (!c.date) return c.day;
  const { month, day } = commitmentCalendarDay(c.date);
  return `${c.day}, ${pad2(day)}/${pad2(month + 1)}`;
}

export function isCommitmentToday(
  c: ScheduleFields,
  now: Date = new Date(),
): boolean {
  if (c.repeat === "weekly") {
    return normalize(c.day) === normalize(WEEKDAY_LONG[now.getDay()]);
  }
  if (!c.date) return false;
  const { year, month, day } = commitmentCalendarDay(c.date);
  return (
    year === now.getFullYear() &&
    month === now.getMonth() &&
    day === now.getDate()
  );
}
