import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ErrorResponse } from "../types";
import { tokenStorage } from "./storage";
import { createRequestMethods } from "./request";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const TIMEOUT = 30000;

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor - attach token
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.get();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorResponse>) => {
    const { response } = error;
    if (!response) return Promise.reject(error);

    if (response.status === 401) {
      tokenStorage.remove();
      localStorage.removeItem("user");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    if (response.status === 429) {
      const retryAfter = response.headers["retry-after"];
      console.warn(`Rate limited. Retry after: ${retryAfter}s`);
    }

    return Promise.reject(error);
  }
);

export const api = createRequestMethods(client);
export default client;
export { BASE_URL };
