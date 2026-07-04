import axios from "axios";
import axiosRetry from "axios-retry";
import { fetchAuthSession } from "aws-amplify/auth";
import { ENV } from "@/config/env";

// Portado de resgatar_app/src/services/api.ts (idêntico). O token do Cognito é
// injetado a cada request autenticada.

export const api = axios.create({
  baseURL: ENV.API_BASE_URL,
});

api.interceptors.request.use(async (config) => {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const publicApi = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 15000,
});

axiosRetry(publicApi, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) =>
    axiosRetry.isNetworkError(error) || error.response?.status === 503,
});
