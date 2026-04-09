import { create } from "zustand";
import { bookingService } from "../services";
import type { Booking, BookingStatus, BookingCreateData, BookingRatingData } from "../types";

export type { Booking, BookingStatus };

export interface BookingState {
  // State
  bookings: Booking[];
  selectedBooking: Booking | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchBookings: () => Promise<void>;
  fetchBooking: (id: string) => Promise<void>;
  createBooking: (data: BookingCreateData) => Promise<Booking>;
  cancelBooking: (id: string) => Promise<void>;
  rateBooking: (id: string, data: BookingRatingData) => Promise<void>;
  updateBookingStatus: (id: string, status: BookingStatus) => void;
  selectBooking: (booking: Booking | null) => void;
  clearError: () => void;
  
  // Legacy methods for backward compatibility
  setBookings: (bookings: Booking[]) => void;
  addBooking: (booking: Booking) => void;
  updateBooking: (id: string, data: Partial<Booking>) => void;
  removeBooking: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  // Initial state
  bookings: [],
  selectedBooking: null,
  loading: false,
  error: null,

  // ==========================================
  // Data Fetching
  // ==========================================

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

  fetchBooking: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const booking = await bookingService.getBooking(id);
      set({ selectedBooking: booking, loading: false });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || "Failed to load booking",
        loading: false,
      });
      throw error;
    }
  },

  // ==========================================
  // CRUD Operations
  // ==========================================

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
        selectedBooking: state.selectedBooking?._id === id ? updated : state.selectedBooking,
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

  // ==========================================
  // State Updates (for real-time updates)
  // ==========================================

  updateBookingStatus: (id: string, status: BookingStatus) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b._id === id ? { ...b, status } : b
      ),
      selectedBooking:
        state.selectedBooking?._id === id
          ? { ...state.selectedBooking, status }
          : state.selectedBooking,
    }));
  },

  selectBooking: (booking: Booking | null) => {
    set({ selectedBooking: booking });
  },

  clearError: () => set({ error: null }),

  // ==========================================
  // Legacy methods for backward compatibility
  // ==========================================

  setBookings: (bookings) => set({ bookings }),

  addBooking: (booking) =>
    set((state) => ({ bookings: [booking, ...state.bookings] })),

  updateBooking: (id, data) =>
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b._id === id ? { ...b, ...data } : b
      ),
    })),

  removeBooking: (id) =>
    set((state) => ({
      bookings: state.bookings.filter((b) => b._id !== id),
    })),

  setLoading: (loading) => set({ loading }),
}));
