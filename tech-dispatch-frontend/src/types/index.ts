export type UserRole = "user" | "technician" | "admin";

export interface Warning {
  _id: string;
  reason: string;
  issuedAt: string;
  issuedBy?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  warnings?: Warning[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Technician {
  _id: string;
  user: string | User;
  name?: string;
  email?: string;
  phone?: string;
  skills: string[];
  status: "active" | "inactive";
  approved: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalTechnicians: number;
  pendingTechnicians: number;
  approvedTechnicians: number;
}

export type JobStatPoint = { label: string; completed: number; failed: number };
export interface JobStats {
  daily: JobStatPoint[];
  weekly: JobStatPoint[];
  monthly: JobStatPoint[];
  yearly: JobStatPoint[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  count: number;
  total: number;
  page: number;
  pages: number;
  data: T[];
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

export type JobStatus =
  | "searching"
  | "assigned"
  | "en_route"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "expired";

export interface Job {
  _id: string;
  user: string | User;
  technician: string | Technician | null;
  serviceType: string;
  description: string;
  clientLocation: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  clientAddress?: string;
  status: JobStatus;
  rating?: string | Rating;
  expiresAt: string;
  acceptedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Rating {
  _id: string;
  job: string | Job;
  technician: string | Technician;
  client: string | User;
  stars: number;
  review?: string;
  createdAt?: string;
}

export interface LocationCoords {
  lat: number;
  lng: number;
}
