import express from "express";
import {
  requestBooking,
  getBookings,
  getBooking,
  acceptBooking,
  rejectBooking,
  cancelBooking,
  startBooking,
  failBooking,
  completeBooking,
  rateBooking,
  getRoute
} from "../controllers/booking.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { isTechnician } from "../middlewares/role.middleware.js";

const router = express.Router();

router.route("/")
  .get(protect, getBookings)
  .post(protect, requestBooking);

router.route("/:id")
  .get(protect, getBooking);

router.get("/:id/route", protect, getRoute);

// Technician actions
router.put("/:id/accept", protect, isTechnician, acceptBooking);
router.put("/:id/reject", protect, isTechnician, rejectBooking);
router.put("/:id/start", protect, isTechnician, startBooking);
router.put("/:id/fail", protect, isTechnician, failBooking);
router.put("/:id/complete", protect, isTechnician, completeBooking);

// User actions
router.put("/:id/cancel", protect, cancelBooking);

// Rating action
router.post("/:id/rate", protect, rateBooking);

export default router;
