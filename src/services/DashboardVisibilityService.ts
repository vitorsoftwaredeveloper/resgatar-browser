import {
  IDashboardVisibilitySettings,
  IUpdateDashboardVisibilityPayload,
} from "@/types/DashboardVisibility";
import { api } from "./api";

export const DashboardVisibilityServices = {
  get: async (): Promise<IDashboardVisibilitySettings> => {
    try {
      const response = await api.get("/dashboard-settings/guest-visibility");
      const { data } = response.data;

      return data;
    } catch (error) {
      console.error("Error fetching dashboard visibility", error);
      throw error;
    }
  },
  update: async (
    payload: IUpdateDashboardVisibilityPayload,
  ): Promise<void> => {
    try {
      await api.put("/dashboard-settings/guest-visibility", payload);
    } catch (error) {
      console.error("Error updating dashboard visibility", error);
      throw error;
    }
  },
};
