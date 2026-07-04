// Portado de resgatar_app/src/types/Commitment/index.ts (idêntico).

export type CommitmentRepeat = "weekly" | "monthly" | "once";

export type CommitmentOrdinal = 1 | 2 | 3 | 4 | 5 | "last";

export interface ICommitment {
  id: string;
  title: string;
  day: string;
  time: string;
  location: string;
  repeat: CommitmentRepeat;
  weekday: number | null;
  ordinal: CommitmentOrdinal | null;
  date: string | null;
}

export interface ICommitmentInput {
  title: string;
  time: string;
  location: string;
  repeat: CommitmentRepeat;
  weekday?: number;
  ordinal?: CommitmentOrdinal;
  date?: string;
}
