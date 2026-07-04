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

export function commitmentScheduleLabel(c: ScheduleFields): string {
  if (c.repeat === "weekly") return `Toda ${c.day}`;
  if (!c.date) return c.day;
  const d = new Date(c.date);
  return `${c.day}, ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
}

export function isCommitmentToday(
  c: ScheduleFields,
  now: Date = new Date(),
): boolean {
  if (c.repeat === "weekly") {
    return normalize(c.day) === normalize(WEEKDAY_LONG[now.getDay()]);
  }
  if (!c.date) return false;
  const d = new Date(c.date);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}
