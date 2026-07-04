import { IAnnualBalance } from "@/types/Balance";
import { api } from "./api";

// Portado de resgatar_app/src/services/BalanceService.ts (idêntico).
export const BalanceServices = {
  getAnnual: async (year: number): Promise<IAnnualBalance> => {
    try {
      const response = await api.get("/balance/annual", {
        params: { year },
      });
      const { data } = response.data;

      return data;
    } catch (error) {
      console.error("Error fetching annual balance", error);
      throw error;
    }
  },
};
