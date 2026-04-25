import Booking from "../models/Booking.js";
import Technician from "../models/Technician.js";
import { findNearestTechnician } from "./findNearestTechnician.js";
import { getShortestPath, calculateETA } from "./dijkstra.js";
import { getIO } from "../socket/index.js";

const EXPIRY_DURATION = 10 * 60 * 1000; // 10 minutes

const markFailed = async (bookingId, reason) => {
  await Booking.findByIdAndUpdate(bookingId, {
    status: "failed",
    $push: {
      statusHistory: { status: "failed", triggeredBy: "system", reason, timestamp: new Date() },
    },
  });
};

const waitForAcceptance = async (bookingId, timeoutMs) => {
  const checkInterval = 2000;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const booking = await Booking.findById(bookingId);
    if (!booking) return null;

    const entry = booking.requestQueue[0];
    if (!entry) return null;
    if (entry.status === "accepted") return entry.technicianId;
    if (entry.status === "rejected" || entry.status === "expired") return null;

    await new Promise((resolve) => setTimeout(resolve, checkInterval));
  }

  // Expire the still-pending entry on timeout
  await Booking.findByIdAndUpdate(
    bookingId,
    { $set: { "requestQueue.$[elem].status": "expired" } },
    { arrayFilters: [{ "elem.status": "pending" }] }
  );
  return null;
};

export const dispatchTechnicians = async (bookingId, userLocation, serviceType) => {
  try {
    const result = await findNearestTechnician(userLocation);

    if (!result) {
      console.log(`[Dispatch] No technicians available for booking ${bookingId}`);
      await markFailed(bookingId, "no_technicians_available");
      return null;
    }

    const { technician, distanceKm } = result;

    // Compute Dijkstra path from technician to user
    const [userLng, userLat] = userLocation;
    const [techLng, techLat] = technician.location.coordinates;
    const { path, distance: roadDistance, waypoints } = getShortestPath(
      techLat, techLng, userLat, userLng
    );
    const etaMinutes = calculateETA(roadDistance);

    const expiresAt = new Date(Date.now() + EXPIRY_DURATION);

    await Booking.findByIdAndUpdate(bookingId, {
      $push: {
        requestQueue: {
          technicianId: technician._id,
          status: "pending",
          distance: distanceKm,
          rank: 1,
        },
      },
      radiusUsed: 50,
      expiresAt,
    });

    const io = getIO();
    io.to(`technician:${technician.user._id}`).emit("booking-request", {
      bookingId,
      serviceType,
      distanceKm,
      roadDistance,
      etaMinutes,
      path,
      waypoints,
      expiresAt: expiresAt.getTime(),
    });

    console.log(
      `[Dispatch] Booking ${bookingId} → ${technician.user.name} ` +
      `(${distanceKm.toFixed(2)} km straight, ${roadDistance.toFixed(2)} km road)`
    );

    const techId = await waitForAcceptance(bookingId, EXPIRY_DURATION);

    if (!techId) {
      console.log(`[Dispatch] No acceptance for booking ${bookingId}`);
      await markFailed(bookingId, "no_acceptance");
      return null;
    }

    const updated = await Booking.findOneAndUpdate(
      { _id: bookingId, status: "requested" },
      {
        technicianId: techId,
        status: "accepted",
        acceptedAt: new Date(),
        $push: {
          statusHistory: { status: "accepted", triggeredBy: "technician", timestamp: new Date() },
        },
      },
      { new: true }
    );

    if (!updated) return null;

    await Technician.findByIdAndUpdate(techId, { status: "busy" });

    io.to(`user:${updated.userId}`).emit("booking-accepted", {
      bookingId: updated._id,
      technician,
      path,
      waypoints,
      roadDistance,
      etaMinutes,
    });

    return techId;
  } catch (error) {
    console.error("[Dispatch] Error:", error);
    await markFailed(bookingId, "dispatch_error");
    return null;
  }
};
