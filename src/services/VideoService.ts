import { IPaginatedVideos, IVideoListFilters } from "@/types/Video";
import { api } from "./api";

// Portado de resgatar_app/src/services/VideoService.ts (idêntico — mesma API).

export const VideoService = {
  listAllVideos: async (page: number, limit: number, filters?: IVideoListFilters): Promise<IPaginatedVideos> => {
    try {
      const response = await api.get("/videos", {
        params: {
          page,
          limit,
          title: filters?.title,
          memberId: filters?.memberId,
        },
      });

      const { data } = response.data;

      return data;
    } catch (error) {
      console.error("Erro ao listar feed de vídeos", error);
      throw error;
    }
  },

  createVideo: async (url: string, title?: string): Promise<void> => {
    try {
      await api.post("/videos", { url, title });
    } catch (error) {
      console.error("Erro ao cadastrar vídeo", error);
      throw error;
    }
  },

  removeVideo: async (videoId: string): Promise<void> => {
    try {
      await api.delete(`/videos/${videoId}`);
    } catch (error) {
      console.error("Erro ao remover vídeo", error);
      throw error;
    }
  },
};
