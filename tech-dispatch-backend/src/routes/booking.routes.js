import express from "express";
import {
  requestBooking,
  getBookings,
  getBooking,
  acceptBooking,
  rejectBooking,
  cancelBooking,
  failBooking,
  completeBooking
} from "../controllers/booking.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { isTechnician } from "../middlewares/role.middleware.js";

const router = express.Router();

router.route("/")
  .get(protect, getBookings)
  .post(protect, requestBooking);

router.route("/:id")
  .get(protect, getBooking);

// Technician actions
router.put("/:id/accept", protect, isTechnician, acceptBooking);
router.put("/:id/reject", protect, isTechnician, rejectBooking);
router.put("/:id/fail", protect, isTechnician, failBooking);
router.put("/:id/complete", protect, isTechnician, completeBooking);

// User actions
router.put("/:id/cancel", protect, cancelBooking);

export default router;
