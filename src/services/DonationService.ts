import { IDonation } from "@/types/Donation";
import { api } from "./api";

// Portado de resgatar_app/src/services/DonationService.ts (idêntico — mesma API).

export const DonationServices = {
  createPix: async (amount: string, donorName?: string): Promise<IDonation> => {
    try {
      const response = await api.post("/donations", {
        amount,
        ...(donorName ? { donorName } : {}),
      });
      return response.data.data;
    } catch (error) {
      console.error("Erro ao criar doação PIX", error);
      throw error;
    }
  },

  // Exclusivo de admin no backend (não passa pelo MP, entra como aprovado).
  registerCash: async (
    amount: string,
    donorName?: string,
    referenceMonth?: number,
  ): Promise<IDonation> => {
    try {
      const response = await api.post("/donations/cash", {
        amount,
        ...(donorName ? { donorName } : {}),
        ...(referenceMonth != null ? { referenceMonth } : {}),
      });
      return response.data.data;
    } catch (error) {
      console.error("Erro ao registrar doação em dinheiro", error);
      throw error;
    }
  },

  // Consulta o status atual de uma doação. Usado como fallback quando a
  // confirmação automática ainda não chegou.
  consult: async (transactionId: string): Promise<IDonation> => {
    try {
      const response = await api.get(`/donations/${transactionId}`);
      return response.data.data;
    } catch (error) {
      console.error("Erro ao consultar doação", error);
      throw error;
    }
  },

  list: async (year: number): Promise<IDonation[]> => {
    try {
      const response = await api.get("/donations", { params: { year } });
      return response.data.data;
    } catch (error) {
      console.error("Erro ao listar doações", error);
      throw error;
    }
  },
};
