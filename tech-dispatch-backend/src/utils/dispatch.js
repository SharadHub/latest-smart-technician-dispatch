import Technician from "../models/Technician.js";
import Booking from "../models/Booking.js";
import { getIO } from "../socket/index.js";

// Expiry duration: 60 minutes (timestamp-based, no timers)
const EXPIRY_DURATION = 60 * 60 * 1000;

/**
 * Push technicians to booking request queue and set expiry
 */
const pushToQueue = async (bookingId, technicians, radius) => {
  const queueEntries = technicians.map((tech) => ({
    technicianId: tech._id,
    status: "pending",
    respondedAt: null
  }));

  const expiresAt = new Date(Date.now() + EXPIRY_DURATION); // 60 minutes from now

  await Booking.findByIdAndUpdate(bookingId, {
    $push: { requestQueue: { $each: queueEntries } },
    radiusUsed: radius,
    expiresAt: expiresAt
  });

  return expiresAt;
};

/**
 * Wait for technician acceptance within timeout
 * Uses timestamp comparison instead of setTimeout
 */
const waitForAcceptance = async (bookingId, timeoutMs) => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const booking = await Booking.findById(bookingId);

    // Check if any technician accepted
    const accepted = booking.requestQueue.find(
      (entry) => entry.status === "accepted"
    );

    if (accepted) {
      return accepted.technicianId;
    }

    // Check if all rejected or expired
    const allResponded = booking.requestQueue.every(
      (entry) => entry.status !== "pending"
    );

    if (allResponded) {
      return null;
    }

    // Small delay to prevent tight loop
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Timeout reached - mark pending as expired
  await Booking.findByIdAndUpdate(bookingId, {
    $set: {
      "requestQueue.$[elem].status": "expired"
    }
  }, {
    arrayFilters: [{ "elem.status": "pending" }]
  });

  return null;
};

/**
 * Dispatch technicians using expanding radius search (KNN-based)
 * MongoDB requires GeoJSON format for efficient geospatial queries.
 * Using a 2dsphere index allows fast nearest-neighbor searches.
 */
export const dispatchTechnicians = async (bookingId, userLocation) => {
  const radii = [3, 5, 8, 12, 18, 22];

  for (const radius of radii) {
    const technicians = await Technician.find({
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: userLocation
          },
          $maxDistance: radius * 1000
        }
      },
      approved: true,
      status: "active"
    }).limit(5);

    if (!technicians.length) continue;

    // Get booking details for the notification
    const booking = await Booking.findById(bookingId);

    const expiresAt = await pushToQueue(bookingId, technicians, radius);

    // Emit real-time notification to each technician
    const io = getIO();
    technicians.forEach((tech) => {
      io.to(`technician:${tech._id}`).emit("booking-request", {
        bookingId,
        serviceType: booking.serviceType,
        expiresAt: expiresAt.getTime()
      });
    });

    const acceptedTech = await waitForAcceptance(bookingId, 60000);

    if (acceptedTech) return acceptedTech;
  }

  return null;
};
