import { api } from "../api/client";
import type { User, Technician, AdminStats, JobStats, Job, PaginatedResponse } from "../types";

export const adminService = {
  getStats: () =>
    api.get<{ success: boolean; data: AdminStats }>("/admin/stats"),

  getJobStats: () =>
    api.get<{ success: boolean; data: JobStats }>("/admin/job-stats"),

  getUsers: (page = 1, limit = 10, search = "") =>
    api.get<PaginatedResponse<User>>(`/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`),

  getUserActivity: (id: string) =>
    api.get<{ success: boolean; data: { user: User; jobs: Job[] } }>(`/admin/users/${id}/activity`),

  deleteUser: (id: string) =>
    api.delete<{ success: boolean }>(`/admin/users/${id}`),

  warnUser: (id: string, reason: string) =>
    api.post<{ success: boolean; data: User }>(`/admin/users/${id}/warn`, { reason }),

  removeWarning: (id: string, warningId: string) =>
    api.delete<{ success: boolean; data: User }>(`/admin/users/${id}/warn/${warningId}`),

  getTechnicians: (page = 1, limit = 10, search = "") =>
    api.get<PaginatedResponse<Technician>>(`/admin/technicians?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`),

  getTechnicianActivity: (id: string) =>
    api.get<{ success: boolean; data: { technician: Technician; jobs: Job[] } }>(`/admin/technicians/${id}/activity`),

  verifyTechnician: (id: string) =>
    api.put<{ success: boolean; data: Technician }>(`/admin/technicians/${id}/verify`),

  deleteTechnician: (id: string) =>
    api.delete<{ success: boolean }>(`/admin/technicians/${id}`),

  warnTechnician: (id: string, reason: string) =>
    api.post<{ success: boolean; data: User }>(`/admin/technicians/${id}/warn`, { reason }),

  removeTechnicianWarning: (id: string, warningId: string) =>
    api.delete<{ success: boolean; data: User }>(`/admin/technicians/${id}/warn/${warningId}`),
};

export default adminService;
