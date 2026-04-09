import { api } from "../api/client";
import type {
  Technician,
  TechnicianProfileUpdate,
  TechnicianLocationUpdate,
  Booking,
  Rating,
  PaginatedResponse,
} from "../types";

export const technicianService = {
  /**
   * Get technician profile
   */
  getProfile: async (): Promise<Technician> => {
    const response = await api.get<{ success: boolean; data: Technician }>("/technicians/profile");
    return response.data;
  },

  /**
   * Update technician profile
   */
  updateProfile: async (data: TechnicianProfileUpdate): Promise<Technician> => {
    const response = await api.put<{ success: boolean; data: Technician }>("/technicians/profile", data);
    return response.data;
  },

  /**
   * Get assigned bookings for technician
   */
  getAssignedBookings: async (page = 1, limit = 10): Promise<PaginatedResponse<Booking>> => {
    const response = await api.get<PaginatedResponse<Booking>>(
      `/technicians/bookings?page=${page}&limit=${limit}`,
      { deduplicate: true }
    );
    return response;
  },

  /**
   * Update technician location
   */
  updateLocation: async (data: TechnicianLocationUpdate): Promise<Technician> => {
    const response = await api.put<{ success: boolean; data: Technician }>("/technicians/location", data);
    return response.data;
  },

  /**
   * Get technician ratings
   */
  getRatings: async (): Promise<Rating[]> => {
    const response = await api.get<{ success: boolean; data: Rating[] }>("/technicians/ratings");
    return response.data;
  },

  /**
   * Toggle availability status
   */
  toggleAvailability: async (): Promise<Technician> => {
    const response = await api.put<{ success: boolean; data: Technician }>("/technicians/availability");
    return response.data;
  },
};

export default technicianService;
