import axios, { type AxiosError } from "axios";
import type { ErrorResponse } from "../types";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorResponse>) => {
    const { response } = error;
    if (!response) return Promise.reject(error);

    if (response.status === 401) {
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export const api = {
  get: <T>(url: string): Promise<T> =>
    client.get<T>(url).then((r) => r.data),

  post: <T>(url: string, data?: unknown): Promise<T> =>
    client.post<T>(url, data).then((r) => r.data),

  put: <T>(url: string, data?: unknown): Promise<T> =>
    client.put<T>(url, data).then((r) => r.data),

  delete: <T>(url: string): Promise<T> =>
    client.delete<T>(url).then((r) => r.data),
};

export default client;
