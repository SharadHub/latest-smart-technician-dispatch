import { api } from "../api/client";
import type { User } from "../types";

interface AuthResponse {
  success: boolean;
  pending?: boolean;
  data: User;
}

export const authService = {
  register: (data: { name: string; email: string; password: string; phone?: string; role?: string; skills?: string[] }) =>
    api.post<AuthResponse>("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>("/auth/login", data),

  logout: () =>
    api.post<{ success: boolean }>("/auth/logout"),

  getMe: () =>
    api.get<AuthResponse>("/auth/me"),
};

export default authService;
