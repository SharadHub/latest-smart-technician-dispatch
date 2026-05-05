import { api } from "../api/client";
import type { Technician } from "../types";

export const technicianService = {
  getProfile: () =>
    api.get<{ success: boolean; data: Technician }>("/technicians/profile"),
};

export default technicianService;
