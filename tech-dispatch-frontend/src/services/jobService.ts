import { api } from "../api/client";
import type { Job } from "../types";

interface CreateJobData {
  serviceType: string;
  description: string;
  lat: number;
  lng: number;
  clientAddress?: string;
}

export const jobService = {
  createJob: (data: CreateJobData) =>
    api.post<{ success: boolean; data: Job }>("/jobs", data).then((r) => r.data),

  getMyJobs: () =>
    api.get<{ success: boolean; data: Job[] }>("/jobs/my").then((r) => r.data),

  getCurrentJob: () =>
    api.get<{ success: boolean; data: Job | null }>("/jobs/current").then((r) => r.data),

  getTechnicianCurrentJob: () =>
    api.get<{ success: boolean; data: Job | null }>("/jobs/technician/current").then((r) => r.data),

  cancelJob: (id: string) =>
    api.post<{ success: boolean }>(`/jobs/${id}/cancel`).then((r) => r.data),
};
