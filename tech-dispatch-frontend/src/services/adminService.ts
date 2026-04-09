import { api } from "../api/client";
import type {
  User,
  Technician,
  AdminStats,
  PaginatedResponse,
} from "../types";

export const adminService = {
  /**
   * Get admin dashboard stats
   */
  getStats: async (): Promise<AdminStats> => {
    const response = await api.get<{ success: boolean; data: AdminStats }>("/admin/stats", {
      deduplicate: true,
    });
    return response.data;
  },

  /**
   * Get all users with pagination
   */
  getUsers: async (page = 1, limit = 10): Promise<PaginatedResponse<User>> => {
    const response = await api.get<PaginatedResponse<User>>(
      `/admin/users?page=${page}&limit=${limit}`,
      { deduplicate: true }
    );
    return response;
  },

  /**
   * Get single user by ID
   */
  getUser: async (id: string): Promise<User> => {
    const response = await api.get<{ success: boolean; data: User }>(`/admin/users/${id}`);
    return response.data;
  },

  /**
   * Update user
   */
  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.put<{ success: boolean; data: User }>(`/admin/users/${id}`, data);
    return response.data;
  },

  /**
   * Delete user
   */
  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/admin/users/${id}`);
  },

  /**
   * Get all technicians with pagination
   */
  getTechnicians: async (page = 1, limit = 10): Promise<PaginatedResponse<Technician>> => {
    const response = await api.get<PaginatedResponse<Technician>>(
      `/admin/technicians?page=${page}&limit=${limit}`,
      { deduplicate: true }
    );
    return response;
  },

  /**
   * Verify a technician
   */
  verifyTechnician: async (id: string): Promise<Technician> => {
    const response = await api.put<{ success: boolean; data: Technician }>(
      `/admin/technicians/${id}/verify`
    );
    return response.data;
  },
};

export default adminService;
