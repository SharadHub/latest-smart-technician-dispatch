
import { createService } from "./factory";

const endpoints = {
  getBookings: {
    path: "/bookings",
    method: "get" as const,
    deduplicate: true,
    transform: (r: any) => r.data,
  },
  getBooking: {
    path: (id: string) => `/bookings/${id}`,
    method: "get" as const,
    transform: (r: any) => r.data,
  },
  createBooking: {
    path: "/bookings",
    method: "post" as const,
    transform: (r: any) => r.data,
  },
  cancelBooking: {
    path: (id: string) => `/bookings/${id}/cancel`,
    method: "put" as const,
    transform: (r: any) => r.data,
  },
  rateBooking: {
    path: (id: string) => `/bookings/${id}/rate`,
    method: "post" as const,
    transform: (r: any) => r.data,
  },
  acceptBooking: {
    path: (id: string) => `/bookings/${id}/accept`,
    method: "put" as const,
    transform: (r: any) => r.data,
  },
  rejectBooking: {
    path: (id: string) => `/bookings/${id}/reject`,
    method: "put" as const,
  },
  completeBooking: {
    path: (id: string) => `/bookings/${id}/complete`,
    method: "put" as const,
    transform: (r: any) => r.data,
  },
  failBooking: {
    path: (id: string) => `/bookings/${id}/fail`,
    method: "put" as const,
    transform: (r: any) => r.data,
  },
  getRoute: {
    path: (id: string) => `/bookings/${id}/route`,
    method: "get" as const,
    transform: (r: any) => r.data,
  },
};

export const bookingService = createService(endpoints);
export default bookingService;
