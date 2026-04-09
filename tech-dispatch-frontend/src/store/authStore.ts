import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "../services";
import type { User } from "../types";

const getErrorMessage = (error: unknown, defaultMsg: string): string => {
  const err = error as { response?: { data?: { message?: string } } };
  return err.response?.data?.message || defaultMsg;
};



const handleAuthSuccess = (set: (fn: (state: AuthState) => Partial<AuthState>) => void, user: User) =>
  set((s) => ({ ...s, user, isAuthenticated: true, isLoading: false, error: null }));

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
  }) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      initialize: async () => {
        if (!authService.getToken()) {
          set((s) => ({ ...s, isAuthenticated: false, user: null }));
          return;
        }
        const storedUser = authService.getStoredUser();
        if (storedUser) set((s) => ({ ...s, user: storedUser as User, isAuthenticated: true }));
        try {
          const user = await authService.getMe();
          set((s) => ({ ...s, user, isAuthenticated: true }));
        } catch {
          authService.logout();
          set((s) => ({ ...s, user: null, isAuthenticated: false }));
        }
      },

      login: async (email, password) => {
        set((s) => ({ ...s, isLoading: true, error: null }));
        try {
          const response = await authService.login({ email, password });
          set((s) => ({ ...s, user: response.data, isAuthenticated: true, isLoading: false, error: null }));
        } catch (error) {
          set((s) => ({ ...s, error: getErrorMessage(error, "Login failed"), isLoading: false }));
          throw error;
        }
      },

      register: async (data) => {
        set((s) => ({ ...s, isLoading: true, error: null }));
        try {
          const response = await authService.register(data);
          handleAuthSuccess(set, response.data);
        } catch (error) {
          set((s) => ({ ...s, error: getErrorMessage(error, "Registration failed"), isLoading: false }));
          throw error;
        }
      },

      logout: () => {
        authService.logout();
        set((s) => ({ ...s, user: null, isAuthenticated: false, error: null }));
      },

      updateUser: async (data) => {
        set((s) => ({ ...s, isLoading: true, error: null }));
        try {
          const updated = await authService.updateDetails(data);
          set((s) => ({ ...s, user: { ...s.user!, ...updated }, isLoading: false }));
        } catch (error) {
          set((s) => ({ ...s, error: getErrorMessage(error, "Failed to update profile"), isLoading: false }));
          throw error;
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        set((s) => ({ ...s, isLoading: true, error: null }));
        try {
          await authService.updatePassword({ currentPassword, newPassword });
          set((s) => ({ ...s, isLoading: false }));
        } catch (error) {
          set((s) => ({ ...s, error: getErrorMessage(error, "Failed to change password"), isLoading: false }));
          throw error;
        }
      },

      deleteAccount: async () => {
        set((s) => ({ ...s, isLoading: true, error: null }));
        try {
          await authService.deleteAccount();
          set((s) => ({ ...s, user: null, isAuthenticated: false, isLoading: false }));
        } catch (error) {
          set((s) => ({ ...s, error: getErrorMessage(error, "Failed to delete account"), isLoading: false }));
          throw error;
        }
      },

      clearError: () => set((s) => ({ ...s, error: null })),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export default useAuthStore;
