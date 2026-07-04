import { api } from "@/services/api";
import { ICommitment, ICommitmentInput } from "@/types/Commitment";

// Portado de resgatar_app/src/services/CommitmentService (idêntico — mesma API).

export const CommitmentService = {
  async list(): Promise<ICommitment[]> {
    try {
      const response = await api.get("/commitments");
      return response.data.data ?? [];
    } catch (error) {
      console.error("Erro ao listar compromissos", error);
      throw error;
    }
  },

  async create(input: ICommitmentInput): Promise<ICommitment> {
    try {
      const response = await api.post("/commitments", input);
      return response.data.data;
    } catch (error) {
      console.error("Erro ao criar compromisso", error);
      throw error;
    }
  },

  async update(id: string, input: ICommitmentInput): Promise<ICommitment> {
    try {
      const response = await api.put(`/commitments/${id}`, input);
      return response.data.data;
    } catch (error) {
      console.error("Erro ao editar compromisso", error);
      throw error;
    }
  },

  async saveOrder(items: ICommitment[]): Promise<void> {
    try {
      await api.put("/commitments/order", { ids: items.map((item) => item.id) });
    } catch (error) {
      console.error("Erro ao reordenar compromissos", error);
      throw error;
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await api.delete(`/commitments/${id}`);
    } catch (error) {
      console.error("Erro ao remover compromisso", error);
      throw error;
    }
  },
};
