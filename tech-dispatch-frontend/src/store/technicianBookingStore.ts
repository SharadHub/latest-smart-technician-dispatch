import { create } from "zustand";
import type { SocketBookingRequestPayload } from "../types";

export type TechnicianBooking = SocketBookingRequestPayload;

interface TechnicianBookingState {
  bookings: TechnicianBooking[];
  addBooking: (booking: TechnicianBooking) => void;
  removeBooking: (bookingId: string) => void;
  updateBooking: (bookingId: string, data: Partial<TechnicianBooking>) => void;
  clearBookings: () => void;
}

export const useTechnicianBookingStore = create<TechnicianBookingState>((set) => ({
  bookings: [],

  addBooking: (booking) =>
    set((state) => {
      if (state.bookings.some((b) => b.bookingId === booking.bookingId)) return state;
      return { bookings: [...state.bookings, booking] };
    }),

  removeBooking: (bookingId) =>
    set((state) => ({
      bookings: state.bookings.filter((b) => b.bookingId !== bookingId),
    })),

  updateBooking: (bookingId, data) =>
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.bookingId === bookingId ? { ...b, ...data } : b
      ),
    })),

  clearBookings: () => set({ bookings: [] }),
}));
