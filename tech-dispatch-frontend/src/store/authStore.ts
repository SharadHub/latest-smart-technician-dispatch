import { create } from "zustand";
import api from "../api/axios";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "user" | "technician" | "admin";
  location?: {
    city?: string;
    lat?: number;
    lng?: number;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  initialize: () => void;
  updateUser: (data: Partial<User>) => void;
  clearError: () => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: "user" | "technician";
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,

  initialize: () => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ token, user });
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, data } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(data));
      set({ token, user: data, loading: false });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      set({
        loading: false,
        error: error.response?.data?.message || "Login failed",
      });
      throw err;
    }
  },

  register: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post("/auth/register", data);
      const { token, data: userData } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      set({ token, user: userData, loading: false });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      set({
        loading: false,
        error: error.response?.data?.message || "Registration failed",
      });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, token: null });
  },

  updateUser: (data) => {
    set((state) => {
      if (!state.user) return state;
      const updated = { ...state.user, ...data };
      localStorage.setItem("user", JSON.stringify(updated));
      return { user: updated };
    });
  },

  clearError: () => set({ error: null }),
}));
