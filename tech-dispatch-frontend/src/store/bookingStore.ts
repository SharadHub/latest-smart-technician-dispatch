import { create } from "zustand";
import { bookingService } from "../services";
import type { Booking, BookingStatus, BookingCreateData, BookingRatingData } from "../types";

export type { Booking, BookingStatus };

export interface BookingState {
  bookings: Booking[];
  loading: boolean;
  error: string | null;

  fetchBookings: () => Promise<void>;
  createBooking: (data: BookingCreateData) => Promise<Booking>;
  cancelBooking: (id: string) => Promise<void>;
  rateBooking: (id: string, data: BookingRatingData) => Promise<void>;
  updateBookingStatus: (id: string, status: BookingStatus) => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  bookings: [],
  loading: false,
  error: null,

  fetchBookings: async () => {
    set({ loading: true, error: null });
    try {
      const bookings = await bookingService.getBookings();
      set({ bookings, loading: false });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || "Failed to load bookings",
        loading: false,
      });
      throw error;
    }
  },

  createBooking: async (data: BookingCreateData) => {
    set({ loading: true, error: null });
    try {
      const booking = await bookingService.createBooking(data);
      set((state) => ({
        bookings: [booking, ...state.bookings],
        loading: false,
      }));
      return booking;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || "Failed to create booking",
        loading: false,
      });
      throw error;
    }
  },

  cancelBooking: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const updated = await bookingService.cancelBooking(id);
      set((state) => ({
        bookings: state.bookings.map((b) => (b._id === id ? updated : b)),
        loading: false,
      }));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || "Failed to cancel booking",
        loading: false,
      });
      throw error;
    }
  },

  rateBooking: async (id: string, data: BookingRatingData) => {
    set({ loading: true, error: null });
    try {
      await bookingService.rateBooking(id, data);
      set({ loading: false });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || "Failed to submit rating",
        loading: false,
      });
      throw error;
    }
  },

  updateBookingStatus: (id: string, status: BookingStatus) => {
    set((state) => ({
      bookings: state.bookings.map((b) => (b._id === id ? { ...b, status } : b)),
    }));
  },
}));
