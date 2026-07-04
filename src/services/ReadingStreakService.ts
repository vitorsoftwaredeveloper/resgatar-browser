import { api } from "@/services/api";

// Portado de resgatar_app/src/services/ReadingStreakService.ts (idêntico).

export interface IReadingStreak {
  currentStreak: number;
  longestStreak: number;
  lastReadAt: string | null;
  alreadyDoneToday: boolean;
}

export const ReadingStreakService = {
  async markToday(): Promise<IReadingStreak> {
    const { data } = await api.patch("/members/reading-streak");
    return data.data;
  },
};
