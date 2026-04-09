import Booking from "../models/Booking.js";
import Technician from "../models/Technician.js";
import Rating from "../models/Rating.js";
import { dispatchTechnicians } from "../utils/dispatch.js";
import { getIO } from "../socket/index.js";
import { calculateDistance, generateSmoothPath, calculateETA } from "../utils/pathfinding.js";

const isExpired = (booking) => booking.status === "requested" && booking.expiresAt && booking.expiresAt < new Date();

const getTechnicianFromUser = async (userId) => {
  const tech = await Technician.findOne({ user: userId });
  return tech?._id || null;
};

const history = (status, by, extra = {}) => ({ status, triggeredBy: by, timestamp: new Date(), ...extra });

const emitToUser = (userId, event, data) => getIO().to(`user:${userId}`).emit(event, data);

const emitToTechs = (queue, event, data) => {
  const io = getIO();
  queue.forEach((e) => io.to(`technician:${e.technicianId}`).emit(event, data));
};

const rejectOthers = async (bookingId) => {
  await Booking.updateOne(
    { _id: bookingId },
    { $set: { "requestQueue.$[elem].status": "rejected" } },
    { arrayFilters: [{ "elem.status": "pending" }] }
  );
};

// ============ COMMANDS ============

class CreateBookingCommand {
  async execute(req) {
    const { serviceType, userLocation } = req.body;
    const booking = await Booking.create({
      userId: req.user.id,
      serviceType,
      status: "requested",
      statusHistory: [history("requested", "user")],
    });

    dispatchTechnicians(booking._id, userLocation, serviceType)
      .then((techId) => this.#finalize(booking._id, techId))
      .catch(console.error);

    return { status: 201, data: { success: true, message: "Booking created", data: booking } };
  }

  async #finalize(id, techId) {
    const update = techId
      ? { technicianId: techId, status: "accepted", $push: { statusHistory: history("accepted", "technician") } }
      : { status: "failed", $push: { statusHistory: history("failed", "system", { reason: "no_acceptance" }) } };
    // Only update if booking is still in requested status (not already accepted by another means)
    await Booking.findOneAndUpdate({ _id: id, status: "requested" }, update);
  }
}

class GetBookingsQuery {
  async execute(req) {
    const query = req.user.role === "admin" ? {} : { userId: req.user.id };
    const bookings = await Booking.find(query)
      .populate("userId", "name email")
      .populate("technicianId", "name email skills")
      .sort("-createdAt");
    return { status: 200, data: { success: true, count: bookings.length, data: bookings } };
  }
}

class GetBookingQuery {
  async execute(req) {
    const booking = await Booking.findById(req.params.id)
      .populate("userId", "name email")
      .populate("technicianId", "name email")
      .populate("requestQueue.technicianId", "name email");

    if (!booking) return { status: 404, data: { success: false, message: "Booking not found" } };

    const data = booking.toObject();
    if (isExpired(booking)) data.status = "expired";
    return { status: 200, data: { success: true, data } };
  }
}

class AcceptBookingCommand {
  async execute(req) {
    const techId = await getTechnicianFromUser(req.user.id);
    if (!techId) return { status: 404, data: { success: false, message: "Technician profile not found" } };

    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, status: "requested", expiresAt: { $gt: new Date() }, "requestQueue.technicianId": techId, "requestQueue.status": "pending" },
      { $set: { status: "accepted", technicianId: techId, acceptedAt: new Date(), "requestQueue.$.status": "accepted", "requestQueue.$.respondedAt": new Date() }, $push: { statusHistory: history("accepted", "technician") } },
      { new: true }
    );

    if (!booking) return { status: 409, data: { success: false, message: "Booking already accepted or expired" } };

    await rejectOthers(booking._id);
    emitToUser(booking.userId, "booking-updated", { bookingId: booking._id, status: "accepted", technicianId: techId });
    emitToTechs(booking.requestQueue, "booking-updated", { bookingId: booking._id, status: "accepted" });

    return { status: 200, data: { success: true, message: "Booking accepted", data: booking } };
  }
}

class RejectBookingCommand {
  async execute(req) {
    const techId = await getTechnicianFromUser(req.user.id);
    if (!techId) return { status: 404, data: { success: false, message: "Technician profile not found" } };

    await Booking.updateOne(
      { _id: req.params.id, "requestQueue.technicianId": techId, "requestQueue.status": "pending" },
      { $set: { "requestQueue.$.status": "rejected", "requestQueue.$.respondedAt": new Date() } }
    );

    return { status: 200, data: { success: true, message: "Booking rejected" } };
  }
}

class CancelBookingCommand {
  async execute(req) {
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, status: "requested" },
      { $set: { status: "cancelled", cancelledAt: new Date() }, $push: { statusHistory: history("cancelled", "user") } },
      { new: true }
    );

    if (!booking) return { status: 409, data: { success: false, message: "Cannot cancel (already accepted or not found)" } };

    emitToTechs(booking.requestQueue, "booking-updated", { bookingId: booking._id, status: "cancelled" });
    return { status: 200, data: { success: true, message: "Booking cancelled", data: booking } };
  }
}

class FailBookingCommand {
  async execute(req) {
    const techId = await getTechnicianFromUser(req.user.id);
    if (!techId) return { status: 404, data: { success: false, message: "Technician profile not found" } };

    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, technicianId: techId, status: "accepted" },
      { $set: { status: "failed", failedAt: new Date() }, $push: { statusHistory: history("failed", "technician") } },
      { new: true }
    );

    if (!booking) return { status: 409, data: { success: false, message: "Cannot fail (not accepted or not assigned)" } };

    emitToUser(booking.userId, "booking-updated", { bookingId: booking._id, status: "failed" });
    return { status: 200, data: { success: true, message: "Booking marked as failed", data: booking } };
  }
}

class CompleteBookingCommand {
  async execute(req) {
    const techId = await getTechnicianFromUser(req.user.id);
    if (!techId) return { status: 404, data: { success: false, message: "Technician profile not found" } };

    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, technicianId: techId, status: "accepted" },
      { $set: { status: "completed", completedAt: new Date() }, $push: { statusHistory: history("completed", "technician") } },
      { new: true }
    );

    if (!booking) return { status: 409, data: { success: false, message: "Cannot complete (not accepted or not assigned)" } };

    emitToUser(booking.userId, "booking-updated", { bookingId: booking._id, status: "completed" });
    return { status: 200, data: { success: true, message: "Booking completed", data: booking } };
  }
}

class RateBookingCommand {
  async execute(req) {
    const { score, comment } = req.body;
    const booking = await Booking.findOne({ _id: req.params.id, userId: req.user.id, status: "completed" });

    if (!booking) return { status: 404, data: { success: false, message: "Booking not found or not completed" } };
    if (await Rating.findOne({ bookingId: booking._id })) return { status: 400, data: { success: false, message: "Already rated" } };
    if (!score || score < 1 || score > 5) return { status: 400, data: { success: false, message: "Score must be 1-5" } };

    const rating = await Rating.create({ bookingId: booking._id, userId: req.user.id, technicianId: booking.technicianId, score, comment: comment || "" });

    const ratings = await Rating.find({ technicianId: booking.technicianId });
    const avg = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;
    await Technician.findByIdAndUpdate(booking.technicianId, { ratingAvg: avg, ratingCount: ratings.length });

    return { status: 201, data: { success: true, message: "Rating submitted", data: rating } };
  }
}

class GetRouteQuery {
  async execute(req) {
    const booking = await Booking.findById(req.params.id)
      .populate("userId", "name location")
      .populate("technicianId", "name location");

    if (!booking) return { status: 404, data: { success: false, message: "Booking not found" } };

    // Get user location (from booking or user profile)
    let userLat, userLng;
    if (booking.userLocation) {
      userLng = booking.userLocation[0];
      userLat = booking.userLocation[1];
    } else if (booking.userId?.location?.lat) {
      userLat = booking.userId.location.lat;
      userLng = booking.userId.location.lng;
    } else {
      return { status: 400, data: { success: false, message: "User location not available" } };
    }

    // Get technician location
    let techLat, techLng;
    if (booking.technicianId?.location?.coordinates) {
      [techLng, techLat] = booking.technicianId.location.coordinates;
    } else {
      return { status: 400, data: { success: false, message: "Technician location not available" } };
    }

    // Calculate distance
    const distance = calculateDistance(techLat, techLng, userLat, userLng);

    // Generate smooth path using KNN-inspired approach
    const path = generateSmoothPath([techLat, techLng], [userLat, userLng], 20);

    // Calculate ETA (assuming 30 km/h average speed)
    const etaMinutes = calculateETA(distance, 30);

    return {
      status: 200,
      data: {
        success: true,
        data: {
          path,
          distance: Math.round(distance * 100) / 100, // Round to 2 decimals
          etaMinutes,
          start: { lat: techLat, lng: techLng, name: booking.technicianId?.name },
          end: { lat: userLat, lng: userLng, name: booking.userId?.name },
        }
      }
    };
  }
}

// ============ HANDLER FACTORY ============

const handler = (Cmd) => async (req, res, next) => {
  try {
    const result = await new Cmd().execute(req);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
};

// ============ EXPORTS ============

export const requestBooking = handler(CreateBookingCommand);
export const getBookings = handler(GetBookingsQuery);
export const getBooking = handler(GetBookingQuery);
export const acceptBooking = handler(AcceptBookingCommand);
export const rejectBooking = handler(RejectBookingCommand);
export const cancelBooking = handler(CancelBookingCommand);
export const failBooking = handler(FailBookingCommand);
export const completeBooking = handler(CompleteBookingCommand);
export const rateBooking = handler(RateBookingCommand);
export const getRoute = handler(GetRouteQuery);
