import { create } from "zustand";
import { authService } from "../services";
import type { User } from "../types";

const getErrorMessage = (error: unknown, defaultMsg: string): string => {
  const err = error as { response?: { data?: { message?: string } } };
  return err.response?.data?.message || defaultMsg;
};

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: "user" | "technician";
    skills?: string[];
  }) => Promise<{ pending: boolean }>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  initialize: async () => {
    try {
      const res = await authService.getMe();
      set({ user: res.data, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.login({ email, password });
      set({ user: res.data, isAuthenticated: true, isLoading: false, error: null });
    } catch (error) {
      set({ error: getErrorMessage(error, "Login failed"), isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.register(data);
      if (!res.pending) {
        set({ user: res.data, isAuthenticated: true, isLoading: false, error: null });
      } else {
        set({ isLoading: false, error: null });
      }
      return { pending: !!res.pending };
    } catch (error) {
      set({ error: getErrorMessage(error, "Registration failed"), isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    set({ user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
