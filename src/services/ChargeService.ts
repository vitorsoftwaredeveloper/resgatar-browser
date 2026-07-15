import {
  IAnnualSummary,
  ICharge,
  IChargeSummary,
  IGoalProgress,
} from "@/types/Charge";
import { api } from "./api";

// Portado de resgatar_app/src/services/ChargeService.ts (idêntico — mesma API).

export const ChargeServices = {
  createCharge: async (month: number): Promise<ICharge> => {
    try {
      const response = await api.post("/charges", {
        referenceMonth: month,
      });
      const { data } = response.data;

      return data;
    } catch (error) {
      console.error("Error creating charge", error);
      throw error;
    }
  },
  // `value` é opcional, no formato "xx,xx"; quando omitido o backend usa o
  // valor de contribuição do onboarding (member.paymentInfo.amount).
  registerCashPayment: async (
    memberId: string,
    referenceMonth: number,
    value?: string,
  ): Promise<void> => {
    try {
      await api.post("/charges/cash", { memberId, referenceMonth, value });
    } catch (error) {
      console.error("Error registering cash payment", error);
      throw error;
    }
  },
  getSummary: async (year: number, month: number): Promise<IChargeSummary> => {
    try {
      const response = await api.get("/charges/summary", {
        params: { year, month },
      });
      const { data } = response.data;

      return data;
    } catch (error) {
      console.error("Error fetching charges summary", error);
      throw error;
    }
  },
  getAnnualSummary: async (year: number): Promise<IAnnualSummary> => {
    try {
      const response = await api.get("/charges/annual-summary", {
        params: { year },
      });
      const { data } = response.data;

      return data;
    } catch (error) {
      console.error("Error fetching annual charges summary", error);
      throw error;
    }
  },
  getGoalProgress: async (): Promise<IGoalProgress> => {
    try {
      const response = await api.get("/charges/goal-progress");
      const { data } = response.data;

      return data;
    } catch (error) {
      console.error("Error fetching goal progress", error);
      throw error;
    }
  },
  // Grava/atualiza a meta do mês (admin). `amount` no formato "xx,xx";
  // `month` é 1-12 (mesma convenção do `getGoalProgress`).
  setMonthlyGoal: async (
    year: number,
    month: number,
    amount: string,
  ): Promise<void> => {
    try {
      await api.put("/charges/monthly-goal", { year, month, amount });
    } catch (error) {
      console.error("Error setting monthly goal", error);
      throw error;
    }
  },
  consultCharge: async (transactionId: string) => {
    try {
      const response = await api.get(`/charges/${transactionId}`);
      const { data } = response.data;

      return data;
    } catch (error) {
      console.error("Error consulting charge", error);
      throw error;
    }
  },
};
