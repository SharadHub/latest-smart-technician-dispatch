import Booking from "../models/Booking.js";
import Technician from "../models/Technician.js";
import User from "../models/User.js";
import { dispatchTechnicians } from "../utils/dispatch.js";
import { getIO } from "../socket/index.js";

/**
 * Helper: Check if booking is expired (derived state, not stored)
 * Expiry is evaluated when accessed, not via background timer
 */
const isExpired = (booking) =>
  booking.status === "requested" && booking.expiresAt && booking.expiresAt < new Date();

// @desc    Request new booking (with auto-dispatch)
// @route   POST /api/bookings
// @access  Private
export const requestBooking = async (req, res, next) => {
  try {
    const { serviceType, userLocation } = req.body;

    // 1. Create booking document
    const booking = await Booking.create({
      userId: req.user.id,
      serviceType,
      status: "requested",
      statusHistory: [{
        status: "requested",
        triggeredBy: "user",
        timestamp: new Date()
      }]
    });

    // 2. Call dispatch algorithm (non-blocking response)
    // Dispatch runs in background, user gets immediate response
    dispatchTechnicians(booking._id, userLocation)
      .then(async (acceptedTechId) => {
        if (acceptedTechId) {
          await Booking.findByIdAndUpdate(booking._id, {
            technicianId: acceptedTechId,
            status: "accepted",
            $push: {
              statusHistory: {
                status: "accepted",
                triggeredBy: "technician",
                timestamp: new Date()
              }
            }
          });
        } else {
          await Booking.findByIdAndUpdate(booking._id, {
            status: "failed",
            $push: {
              statusHistory: {
                status: "failed",
                triggeredBy: "system",
                timestamp: new Date()
              }
            }
          });
        }
      })
      .catch(console.error);

    // 3. Return immediate response
    res.status(201).json({
      success: true,
      message: "Booking created, finding technicians...",
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings for user
// @route   GET /api/bookings
// @access  Private
export const getBookings = async (req, res, next) => {
  try {
    const query = req.user.role === "admin" ? {} : { userId: req.user.id };

    const bookings = await Booking.find(query)
      .populate("userId", "name email")
      .populate("technicianId", "name email skills")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking (with derived expiry check)
// @route   GET /api/bookings/:id
// @access  Private
export const getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("userId", "name email")
      .populate("technicianId", "name email skills")
      .populate("requestQueue.technicianId", "name email");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    // Return derived expiry status without mutating DB
    const bookingData = booking.toObject();
    if (isExpired(booking)) {
      bookingData.status = "expired";
    }

    res.status(200).json({
      success: true,
      data: bookingData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Technician ACCEPTS booking (ATOMIC - race-safe)
// @route   PUT /api/bookings/:id/accept
// @access  Private/Technician
export const acceptBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.id;

    // Get technician document from user
    const technician = await Technician.findOne({ user: req.user.id });
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician profile not found"
      });
    }
    const technicianId = technician._id;

    // ATOMIC: Only one technician can win
    const booking = await Booking.findOneAndUpdate(
      {
        _id: bookingId,
        status: "requested",
        expiresAt: { $gt: new Date() },
        "requestQueue.technicianId": technicianId,
        "requestQueue.status": "pending"
      },
      {
        $set: {
          status: "accepted",
          technicianId: technicianId,
          acceptedAt: new Date(),
          "requestQueue.$.status": "accepted",
          "requestQueue.$.respondedAt": new Date()
        },
        $push: {
          statusHistory: {
            status: "accepted",
            triggeredBy: "technician",
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    if (!booking) {
      return res.status(409).json({
        success: false,
        message: "Booking already accepted or expired"
      });
    }

    // Reject all other pending technicians
    await Booking.updateOne(
      { _id: bookingId },
      {
        $set: {
          "requestQueue.$[elem].status": "rejected"
        }
      },
      {
        arrayFilters: [{ "elem.status": "pending" }]
      }
    );

    // Notify user via WebSocket (canonical event)
    const io = getIO();
    io.to(`user:${booking.userId}`).emit("booking-updated", {
      bookingId,
      status: "accepted",
      technicianId
    });

    // Notify ALL technicians in queue (including winner) that booking status changed
    booking.requestQueue.forEach((entry) => {
      io.to(`technician:${entry.technicianId}`).emit("booking-updated", {
        bookingId,
        status: "accepted"
      });
    });

    res.status(200).json({
      success: true,
      message: "Booking accepted successfully",
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Technician REJECTS booking
// @route   PUT /api/bookings/:id/reject
// @access  Private/Technician
export const rejectBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.id;

    // Get technician document from user
    const technician = await Technician.findOne({ user: req.user.id });
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician profile not found"
      });
    }
    const technicianId = technician._id;

    await Booking.updateOne(
      {
        _id: bookingId,
        "requestQueue.technicianId": technicianId,
        "requestQueue.status": "pending"
      },
      {
        $set: {
          "requestQueue.$.status": "rejected",
          "requestQueue.$.respondedAt": new Date()
        }
      }
    );

    res.status(200).json({
      success: true,
      message: "Booking rejected"
    });
  } catch (error) {
    next(error);
  }
};

// @desc    User cancels booking (ATOMIC - only before acceptance)
// @route   PUT /api/bookings/:id/cancel
// @access  Private
export const cancelBooking = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const bookingId = req.params.id;

    // ATOMIC: Can only cancel if status = "requested"
    const booking = await Booking.findOneAndUpdate(
      {
        _id: bookingId,
        userId: userId,
        status: "requested"
      },
      {
        $set: {
          status: "cancelled",
          cancelledAt: new Date()
        },
        $push: {
          statusHistory: {
            status: "cancelled",
            triggeredBy: "user",
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    if (!booking) {
      return res.status(409).json({
        success: false,
        message: "Booking cannot be cancelled (already accepted or not found)"
      });
    }

    // Notify technicians that booking status changed (canonical event)
    const io = getIO();
    booking.requestQueue.forEach((entry) => {
      io.to(`technician:${entry.technicianId}`).emit("booking-updated", {
        bookingId,
        status: "cancelled"
      });
    });

    res.status(200).json({
      success: true,
      message: "Booking cancelled",
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Technician marks booking as FAILED (only after acceptance)
// @route   PUT /api/bookings/:id/fail
// @access  Private/Technician
export const failBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.id;

    // Get technician document from user
    const technician = await Technician.findOne({ user: req.user.id });
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician profile not found"
      });
    }
    const technicianId = technician._id;

    // ATOMIC: Can only fail if status = "accepted" and assigned to this technician
    const booking = await Booking.findOneAndUpdate(
      {
        _id: bookingId,
        technicianId: technicianId,
        status: "accepted"
      },
      {
        $set: {
          status: "failed",
          failedAt: new Date()
        },
        $push: {
          statusHistory: {
            status: "failed",
            triggeredBy: "technician",
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    if (!booking) {
      return res.status(409).json({
        success: false,
        message: "Booking cannot be failed (not accepted or not assigned to you)"
      });
    }

    // Notify user (canonical event)
    const io = getIO();
    io.to(`user:${booking.userId}`).emit("booking-updated", {
      bookingId,
      status: "failed"
    });

    res.status(200).json({
      success: true,
      message: "Booking marked as failed",
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Technician marks booking as COMPLETED
// @route   PUT /api/bookings/:id/complete
// @access  Private/Technician
export const completeBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.id;

    // Get technician document from user
    const technician = await Technician.findOne({ user: req.user.id });
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician profile not found"
      });
    }
    const technicianId = technician._id;

    // ATOMIC: Can only complete if status = "accepted" and assigned to this technician
    const booking = await Booking.findOneAndUpdate(
      {
        _id: bookingId,
        technicianId: technicianId,
        status: "accepted"
      },
      {
        $set: {
          status: "completed",
          completedAt: new Date()
        },
        $push: {
          statusHistory: {
            status: "completed",
            triggeredBy: "technician",
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    if (!booking) {
      return res.status(409).json({
        success: false,
        message: "Booking cannot be completed (not accepted or not assigned to you)"
      });
    }

    // Notify user (canonical event)
    const io = getIO();
    io.to(`user:${booking.userId}`).emit("booking-updated", {
      bookingId,
      status: "completed"
    });

    res.status(200).json({
      success: true,
      message: "Booking completed successfully",
      data: booking
    });
  } catch (error) {
    next(error);
  }
};
