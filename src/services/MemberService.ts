import { api, publicApi } from "./api";
import { IMember, IMemberWithContribution } from "@/types/Member";

// Portado de resgatar_app/src/services/MemberService.ts (idêntico — mesma API).

export const MemberServices = {
  getMember: async (): Promise<IMemberWithContribution> => {
    try {
      const response = await api.get("/members");
      const { data } = response.data;

      return data;
    } catch (error) {
      console.error("Erro ao obter membros", error);
      throw error;
    }
  },
  editMember: async (member: IMember) => {
    try {
      const response = await api.put(`/members/${member._id}`, member);
      const { data } = response.data;

      return data;
    } catch (error) {
      console.error("Erro ao editar membro", error);
      throw error;
    }
  },

  getMemberById: async (memberId: string): Promise<IMemberWithContribution> => {
    try {
      const response = await api.get(`/members/${memberId}`);
      const { data } = response.data;

      return data;
    } catch (error) {
      console.error("Erro ao obter membro", error);
      throw error;
    }
  },
  listMembers: async () => {
    try {
      const response = await api.get("/members/list");
      const { data } = response.data;

      return data;
    } catch (error) {
      console.error("Erro ao listar membros", error);
      throw error;
    }
  },
  listBirthdayMembers: async (): Promise<IMember[]> => {
    try {
      const response = await api.get("/members/birthdays");
      const { data } = response.data;

      return data;
    } catch (error) {
      console.error("Erro ao listar aniversariantes", error);
      throw error;
    }
  },
  removeMember: async (memberId: string) => {
    try {
      const response = await api.delete(`/members/${memberId}`);
      const { data } = response.data;

      return data;
    } catch (error) {
      console.error("Erro ao remover membro", error);
      throw error;
    }
  },
  register: async (member: Omit<IMember, "_id"> & { password: string }) => {
    try {
      const response = await publicApi.post("/members", member);
      const { data } = response.data;
      return data;
    } catch (error) {
      console.error("Erro ao registrar membro", error);
      throw error;
    }
  },
  updatePhoto: async (memberId: string, profileImage: string) => {
    try {
      const response = await api.put(`/members/${memberId}`, {
        profileImage,
      });
      const { data } = response.data;

      return data;
    } catch (error) {
      console.error("Erro ao atualizar foto", error);
      throw error;
    }
  },
  updatePassword: async (memberId: string, password: string) => {
    try {
      const response = await api.put(`/members/${memberId}/password`, {
        password,
      });
      const { data } = response.data;

      return data;
    } catch (error) {
      console.error("Erro ao atualizar senha", error);
      throw error;
    }
  },
};
