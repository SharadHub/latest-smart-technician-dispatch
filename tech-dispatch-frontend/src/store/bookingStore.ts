import { create } from "zustand";

export interface Booking {
  _id: string;
  userId: { _id: string; name: string; email: string } | string;
  technicianId?: { _id: string; name: string; email: string; skills?: string[] } | string | null;
  serviceType: string;
  status: "requested" | "accepted" | "in-progress" | "completed" | "failed" | "rejected" | "expired" | "cancelled";
  expiresAt?: string;
  acceptedAt?: string;
  completedAt?: string;
  createdAt: string;
}

interface BookingState {
  bookings: Booking[];
  loading: boolean;
  setBookings: (bookings: Booking[]) => void;
  addBooking: (booking: Booking) => void;
  updateBooking: (id: string, data: Partial<Booking>) => void;
  removeBooking: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  bookings: [],
  loading: false,

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
