import express from "express";
import {
  getProfile,
  updateProfile,
  getAssignedBookings,
  updateBookingStatus,
  updateLocation,
  getRatings,
  toggleAvailability
} from "../controllers/technician.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { isTechnician } from "../middlewares/role.middleware.js";

const router = express.Router();

// Apply protect and isTechnician middleware to all routes
router.use(protect, isTechnician);

router.route("/profile")
  .get(getProfile)
  .put(updateProfile);

router.get("/bookings", getAssignedBookings);
router.put("/bookings/:id/status", updateBookingStatus);

router.put("/location", updateLocation);
router.put("/availability", toggleAvailability);
router.get("/ratings", getRatings);

export default router;
