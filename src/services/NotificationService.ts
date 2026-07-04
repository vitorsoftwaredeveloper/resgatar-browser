import { ICharge } from "@/types/Charge";
import { INotification } from "@/types/Notification";
import { api } from "./api";

// Portado de resgatar_app/src/services/NotificationService.ts (idêntico).

export const NotificationServices = {
  createNotification: async (payload: INotification): Promise<ICharge> => {
    try {
      const response = await api.post("/notifications", {
        title: payload.title,
        description: payload.description,
      });
      const { data } = response.data;

      return data;
    } catch (error) {
      console.error("Error creating notification", error);
      throw error;
    }
  },
  listNotifications: async () => {
    try {
      const response = await api.get("/notifications");
      const { data } = response.data;

      return data;
    } catch (error) {
      console.error("Error list notifications", error);
      throw error;
    }
  },
  registerFCMToken: async (token: string): Promise<void> => {
    try {
      await api.patch("/members/push-token", { pushToken: token });
    } catch (error) {
      console.error("Error registering FCM token", error);
      throw error;
    }
  },
};
