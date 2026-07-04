import { AxiosError } from "axios";

// Portado de resgatar_app/src/utils/apiError.ts (idêntico).

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<{ message?: string }>;
  const apiMessage = axiosError?.response?.data?.message;

  return apiMessage && apiMessage.trim().length > 0 ? apiMessage : fallback;
}
