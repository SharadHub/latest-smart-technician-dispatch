import mongoose from "mongoose";
import Job from "../models/Job.js";
import Technician from "../models/Technician.js";
import { notifyNextTechnician } from "../services/dispatchService.js";

// Executes the two-write accept logic; session=null means non-transactional
async function executeAccept(jobId, technicianId, session) {
  const opts = session ? { session } : {};

  const job = await Job.findOneAndUpdate(
    { _id: jobId, status: "searching", dispatchQueue: technicianId },
    { $set: { status: "assigned", technician: technicianId, acceptedAt: new Date() } },
    { new: true, ...opts }
  );

  if (!job) return null;

  await Technician.findByIdAndUpdate(technicianId, { currentJob: jobId }, opts);
  return job;
}

export const registerJobHandlers = (io, socket) => {

  // user:joinRoom kept for backward-compat but session identity already used in index.js
  socket.on("user:joinRoom", ({ userId }) => {
    // Only join the room the session says they own
    if (socket.data.userId && socket.data.userId === userId) {
      socket.join(`user:${userId}`);
    }
  });

  socket.on("technician:acceptJob", async ({ jobId }) => {
    const technicianId = socket.data.technicianId;
    if (!technicianId) {
      socket.emit("job:acceptFailed", { jobId, reason: "not_authenticated" });
      return;
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    let job = null;

    try {
      job = await executeAccept(jobId, technicianId, session);

      if (!job) {
        await session.abortTransaction();
        socket.emit("job:acceptFailed", { jobId, reason: "already_assigned" });
        return;
      }

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction().catch(() => {});

      const isStandalone =
        err.codeName === "IllegalOperation" ||
        (err.message && err.message.includes("Transaction numbers"));

      if (isStandalone) {
        // Standalone MongoDB (no replica set) — fall back to non-transactional
        session.endSession();
        try {
          job = await executeAccept(jobId, technicianId, null);
        } catch (fallback) {
          console.error("technician:acceptJob fallback error:", fallback.message);
          socket.emit("job:acceptFailed", { jobId, reason: "server_error" });
          return;
        }
        if (!job) {
          socket.emit("job:acceptFailed", { jobId, reason: "already_assigned" });
          return;
        }
      } else {
        session.endSession();
        console.error("technician:acceptJob error:", err.message);
        socket.emit("job:acceptFailed", { jobId, reason: "server_error" });
        return;
      }
    } finally {
      // endSession() is safe to call multiple times
      try { session.endSession(); } catch {}
    }

    // Populate after commit for UI data
    const populated = await Job.findById(job._id)
      .populate("user", "name phone _id")
      .populate("technician", "name phone location");

    if (!populated) {
      socket.emit("job:acceptFailed", { jobId, reason: "server_error" });
      return;
    }

    // Notify all previously notified technicians that the job is taken
    for (const notifiedTechId of populated.notifiedTechnicians) {
      if (notifiedTechId.toString() !== technicianId.toString()) {
        io.to(`technician:${notifiedTechId}`).emit("technician:jobCancelled", {
          jobId,
          reason: "another_accepted",
        });
      }
    }

    // Tell the client their job is accepted
    io.to(`user:${populated.user._id}`).emit("job:assigned", {
      jobId: populated._id,
      status: "assigned",
      technician: {
        _id: populated.technician._id,
        name: populated.technician.name,
        phone: populated.technician.phone,
        location: populated.technician.location?.coordinates,
      },
    });

    // Confirm to the accepting technician
    socket.emit("job:acceptSuccess", {
      jobId: populated._id,
      clientName: populated.user.name,
      clientPhone: populated.user.phone,
      clientLocation: populated.clientLocation.coordinates,
      clientAddress: populated.clientAddress,
      serviceType: populated.serviceType,
      description: populated.description,
    });
  });

  socket.on("technician:rejectJob", async ({ jobId }) => {
    const technicianId = socket.data.technicianId;
    if (!technicianId) return;

    try {
      const job = await Job.findOneAndUpdate(
        { _id: jobId, status: "searching" },
        { $inc: { currentDispatchIndex: 1 } },
        { new: true }
      );

      if (!job) return;

      notifyNextTechnician(jobId).catch((err) =>
        console.error(`notifyNextTechnician error after reject:`, err.message)
      );
    } catch (err) {
      console.error("technician:rejectJob error:", err.message);
    }
  });
};
