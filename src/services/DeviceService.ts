import { api } from "./api";
import type { Platform } from "@/utils/device";

export const DeviceServices = {
  register: async (
    token: string,
    platform: Platform,
    installed: boolean,
  ): Promise<void> => {
    await api.post("/devices", { token, platform, installed });
  },

  remove: async (token: string): Promise<void> => {
    await api.delete(`/devices/${encodeURIComponent(token)}`);
  },
};
