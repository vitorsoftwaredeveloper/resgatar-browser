import { api } from "@/services/api";
import { IBanner, IBannerInput } from "@/types/Banner";

// Portado de resgatar_app/src/services/BannerService (idêntico — mesma API).

export const BannerService = {
  async list(): Promise<IBanner[]> {
    try {
      const response = await api.get("/campaigns");
      return response.data.data ?? [];
    } catch (error) {
      console.error("Erro ao listar campanhas", error);
      throw error;
    }
  },

  async create(input: IBannerInput): Promise<IBanner> {
    try {
      const response = await api.post("/campaigns", input);
      return response.data.data;
    } catch (error) {
      console.error("Erro ao criar campanha", error);
      throw error;
    }
  },

  async update(id: string, input: IBannerInput): Promise<IBanner> {
    try {
      const response = await api.put(`/campaigns/${id}`, input);
      return response.data.data;
    } catch (error) {
      console.error("Erro ao editar campanha", error);
      throw error;
    }
  },

  async saveOrder(items: IBanner[]): Promise<void> {
    try {
      await api.put("/campaigns/order", { ids: items.map((b) => b.id) });
    } catch (error) {
      console.error("Erro ao reordenar campanhas", error);
      throw error;
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await api.delete(`/campaigns/${id}`);
    } catch (error) {
      console.error("Erro ao remover campanha", error);
      throw error;
    }
  },
};
