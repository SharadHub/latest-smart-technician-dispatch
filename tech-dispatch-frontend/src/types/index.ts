/**
 * Centralized Type Definitions
 * These types match the backend MongoDB schema and API responses exactly
 */

// ==========================================
// User Types
// ==========================================

export type UserRole = "user" | "technician" | "admin";

export interface UserLocation {
  city?: string;
  lat?: number;
  lng?: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  location?: UserLocation;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserRegistrationData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: "user" | "technician";
}

// ==========================================
// Technician Types
// ==========================================

export type TechnicianStatus = "active" | "busy" | "inactive";

export interface TechnicianLocation {
  type: "Point";
  coordinates: [number, number]; // [lng, lat]
}

export interface Technician {
  _id: string;
  user: string | User; // populated or ID
  name?: string;
  email?: string;
  skills: string[];
  location: TechnicianLocation;
  status: TechnicianStatus;
  approved: boolean;
  ratingAvg: number;
  ratingCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TechnicianProfileUpdate {
  skills?: string[];
  name?: string;
  email?: string;
  location?: TechnicianLocation;
  status?: TechnicianStatus;
}

export interface TechnicianLocationUpdate {
  coordinates: [number, number]; // [lng, lat]
}

// ==========================================
// Booking Types
// ==========================================

export type BookingStatus =
  | "requested"
  | "accepted"
  | "in-progress"
  | "completed"
  | "failed"
  | "rejected"
  | "expired"
  | "cancelled";

export type BookingTrigger = "user" | "technician" | "system";

export interface StatusHistoryEntry {
  status: BookingStatus;
  triggeredBy: BookingTrigger;
  timestamp: string;
  technicianId?: string;
  reason?: string;
}

export interface RequestQueueEntry {
  technicianId: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  respondedAt?: string;
  knnScore: number;
  distance: number;
  skillScore: number;
  ratingScore: number;
  rank: number;
}

export interface Booking {
  _id: string;
  userId: string | User;
  technicianId: string | Technician | null;
  serviceType: string;
  status: BookingStatus;
  expiresAt?: string;
  acceptedAt?: string;
  cancelledAt?: string;
  failedAt?: string;
  completedAt?: string;
  radiusUsed?: number;
  statusHistory: StatusHistoryEntry[];
  requestQueue: RequestQueueEntry[];
  createdAt: string;
  updatedAt?: string;
}

export interface BookingCreateData {
  serviceType: string;
  userLocation: [number, number]; // [lng, lat]
}

export interface BookingRatingData {
  score: number;
  comment?: string;
  technicianId?: string;
}

// ==========================================
// Rating Types
// ==========================================

export interface Rating {
  _id: string;
  bookingId: string | Booking;
  userId: string | User;
  technicianId: string | Technician;
  score: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
}

// ==========================================
// Admin Types
// ==========================================

export interface AdminStats {
  users: number;
  technicians: number;
  bookings: {
    total: number;
    byStatus: Record<BookingStatus, number>;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  count: number;
  total: number;
  page: number;
  pages: number;
  data: T[];
}

export interface AuthResponse {
  success: boolean;
  token: string;
  data: User;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

// ==========================================
// Socket Types
// ==========================================

export interface SocketJoinPayload {
  userId: string;
  role: UserRole;
}

export interface SocketBookingRequestPayload {
  bookingId: string;
  serviceType: string;
  distance?: number;
  knnScore?: number;
  rank?: number;
  expiresAt: number; // timestamp
}

export interface SocketBookingUpdatePayload {
  bookingId: string;
  status: BookingStatus;
  technicianId?: string;
  technician?: Technician;
}

// ==========================================
// Service/Config Types
// ==========================================

export interface ServiceType {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bg: string;
}

// ==========================================
// API Response Types
// ==========================================

export type ApiResponse<T> =
  | { success: true; data: T; message?: string }
  | { success: false; message: string; errors?: Array<{ field: string; message: string }> };

export interface ApiError {
  response?: {
    data?: ErrorResponse;
    status?: number;
  };
  message: string;
}
