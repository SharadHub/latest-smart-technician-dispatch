// Booking status constants
const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Service type constants
const SERVICE_TYPES = {
  PLUMBING: 'plumbing',
  ELECTRICAL: 'electrical',
  HVAC: 'hvac',
  APPLIANCE_REPAIR: 'appliance_repair',
  CARPENTRY: 'carpentry',
  PAINTING: 'painting',
  CLEANING: 'cleaning',
  GENERAL_MAINTENANCE: 'general_maintenance',
};

// User roles
const USER_ROLES = {
  USER: 'user',
  TECHNICIAN: 'technician',
  ADMIN: 'admin',
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

module.exports = {
  BOOKING_STATUS,
  SERVICE_TYPES,
  USER_ROLES,
  PAGINATION,
};
