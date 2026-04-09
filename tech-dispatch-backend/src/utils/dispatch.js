import Booking from "../models/Booking.js";
import Technician from "../models/Technician.js";
import { findKNearestTechnicians } from "./knn.js";
import { getIO } from "../socket/index.js";

const EXPIRY_DURATION = 10 * 60 * 1000;

const createQueueEntries = (technicians) =>
  technicians.map((entry, index) => ({
    technicianId: entry.technician._id,
    status: "pending",
    knnScore: entry.knnScore,
    distance: entry.distance,
    skillScore: entry.skillScore,
    ratingScore: entry.ratingScore,
    rank: index + 1,
    respondedAt: null,
  }));

const pushToQueue = async (bookingId, technicians) => {
  const expiresAt = new Date(Date.now() + EXPIRY_DURATION);
  await Booking.findByIdAndUpdate(bookingId, {
    $push: { requestQueue: { $each: createQueueEntries(technicians) } },
    radiusUsed: 50,
    expiresAt,
  });
  return expiresAt;
};

const notifyTechnicians = (bookingId, technicians, expiresAt, serviceType) => {
  const io = getIO();
  technicians.forEach((entry) => {
    io.to(`technician:${entry.technician._id}`).emit("booking-request", {
      bookingId,
      serviceType,
      distance: entry.distance,
      knnScore: entry.knnScore,
      rank: technicians.findIndex((e) => e.technician._id === entry.technician._id) + 1,
      expiresAt: expiresAt.getTime(),
    });
  });
};

const waitForAcceptance = async (bookingId, timeoutMs) => {
  const checkInterval = 2000;
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const booking = await Booking.findById(bookingId).populate("requestQueue.technicianId");
    if (!booking) return null;
    const accepted = booking.requestQueue.find((e) => e.status === "accepted");
    if (accepted) return accepted.technicianId;
    if (booking.requestQueue.every((e) => e.status !== "pending")) return null;
    await new Promise((resolve) => setTimeout(resolve, checkInterval));
  }
  await Booking.findByIdAndUpdate(bookingId,
    { $set: { "requestQueue.$[elem].status": "expired" } },
    { arrayFilters: [{ "elem.status": "pending" }] }
  );
  return null;
};

const updateBookingAccepted = async (bookingId, techId) => {
  const updated = await Booking.findOneAndUpdate(
    { _id: bookingId, status: "requested" },
    {
      technicianId: techId,
      status: "accepted",
      acceptedAt: new Date(),
      $push: {
        statusHistory: {
          status: "accepted",
          triggeredBy: "technician",
          technicianId: techId,
          timestamp: new Date(),
        },
      },
    },
    { new: true }
  );
  if (updated) await Technician.findByIdAndUpdate(techId, { status: "busy" });
  return updated;
};

const rejectOthers = async (bookingId) => {
  await Booking.updateOne(
    { _id: bookingId },
    { $set: { "requestQueue.$[elem].status": "rejected" } },
    { arrayFilters: [{ "elem.status": "pending" }] }
  );
};

const notifyUserAccepted = (booking, technicians, techId) => {
  const io = getIO();
  const techEntry = technicians.find((e) => e.technician._id.toString() === techId.toString());
  io.to(`user:${booking.userId}`).emit("booking-accepted", {
    bookingId: booking._id,
    technician: techEntry?.technician,
  });
};

const notifyAllUpdated = (booking, technicians, status) => {
  const io = getIO();
  technicians.forEach((entry) => {
    io.to(`technician:${entry.technician._id}`).emit("booking-updated", {
      bookingId: booking._id,
      status,
    });
  });
};

const markFailed = async (bookingId, reason) => {
  await Booking.findByIdAndUpdate(bookingId, {
    status: "failed",
    $push: {
      statusHistory: {
        status: "failed",
        triggeredBy: "system",
        reason,
        timestamp: new Date(),
      },
    },
  });
};

export const dispatchTechnicians = async (bookingId, userLocation, serviceType) => {
  try {
    console.log(`[KNN] Dispatching for booking ${bookingId}`);
    const technicians = await findKNearestTechnicians(userLocation, serviceType);
    if (!technicians.length) {
      console.log("[KNN] No technicians found");
      await markFailed(bookingId, "no_technicians_available");
      return null;
    }
    console.log(`[KNN] Found ${technicians.length} technicians`);
    technicians.forEach((e, i) =>
      console.log(`[KNN] Rank ${i + 1}: ${e.technician.user.name}, Score: ${e.knnScore.toFixed(3)}`)
    );
    const expiresAt = await pushToQueue(bookingId, technicians);
    notifyTechnicians(bookingId, technicians, expiresAt, serviceType);
    const techId = await waitForAcceptance(bookingId, EXPIRY_DURATION);
    if (!techId) {
      console.log(`[KNN] No acceptance for booking ${bookingId}`);
      await markFailed(bookingId, "no_acceptance");
      return null;
    }
    console.log(`[KNN] Technician ${techId} accepted booking ${bookingId}`);
    const updated = await updateBookingAccepted(bookingId, techId);
    if (!updated) {
      console.log("[KNN] Booking already assigned");
      return null;
    }
    await rejectOthers(bookingId);
    const booking = await Booking.findById(bookingId);
    notifyUserAccepted(booking, technicians, techId);
    notifyAllUpdated(booking, technicians, "accepted");
    return techId;
  } catch (error) {
    console.error("[KNN] Dispatch error:", error);
    await markFailed(bookingId, "dispatch_error");
    return null;
  }
};

export const retryDispatch = (bookingId, userLocation, serviceType) => {
  console.log(`[KNN] Retrying dispatch for booking ${bookingId}`);
  return dispatchTechnicians(bookingId, userLocation, serviceType);
};

export { findKNearestTechnicians };
export { calculateDistance, calculateDistanceScore } from "./geo.js";
export { calculateSkillMatch, calculateRatingScore } from "./scoring.js";
