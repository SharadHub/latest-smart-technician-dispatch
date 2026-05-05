import Technician from "../models/Technician.js";
import Job from "../models/Job.js";

export const registerTechnicianHandlers = (io, socket) => {

  socket.on("technician:goOnline", async ({ lat, lng }) => {
    try {
      const userId = socket.data.userId;
      if (!userId) {
        socket.emit("socket:authError", { message: "Not authenticated" });
        return;
      }

      const tech = await Technician.findOne({ user: userId });
      if (!tech || !tech.approved) {
        socket.emit("socket:authError", { message: "Account not approved or not found" });
        return;
      }

      await Technician.findByIdAndUpdate(tech._id, {
        isOnline: true,
        socketId: socket.id,
        "location.coordinates": [lng, lat],
      });

      socket.join(`technician:${tech._id}`);
      socket.data.technicianId = tech._id.toString();
      socket.emit("technician:online", { technicianId: tech._id });
    } catch (err) {
      console.error("technician:goOnline error:", err.message);
    }
  });

  socket.on("technician:goOffline", async () => {
    try {
      const technicianId = socket.data.technicianId;
      if (!technicianId) return;

      await Technician.findByIdAndUpdate(technicianId, {
        isOnline: false,
        socketId: null,
      });
      socket.data.technicianId = null;
    } catch (err) {
      console.error("technician:goOffline error:", err.message);
    }
  });

  socket.on("technician:updateLocation", async ({ lat, lng }) => {
    try {
      const technicianId = socket.data.technicianId;
      if (!technicianId) return;

      await Technician.findByIdAndUpdate(technicianId, {
        "location.coordinates": [lng, lat],
      });

      // Forward location to client for all active in-field statuses
      const job = await Job.findOne({
        technician: technicianId,
        status: { $in: ["assigned", "en_route", "in_progress"] },
      }).select("_id user");

      if (job) {
        io.to(`user:${job.user}`).emit("tracking:technicianMoved", {
          jobId: job._id,
          lat,
          lng,
        });
      }
    } catch (err) {
      console.error("technician:updateLocation error:", err.message);
    }
  });

  // Transition: assigned → in_progress (technician has arrived and started work)
  socket.on("technician:startJob", async ({ jobId }) => {
    try {
      const technicianId = socket.data.technicianId;
      if (!technicianId) return;

      const job = await Job.findOneAndUpdate(
        { _id: jobId, technician: technicianId, status: "assigned" },
        { $set: { status: "in_progress" } },
        { new: true }
      );

      if (!job) {
        socket.emit("job:actionFailed", { jobId, reason: "Job not found or wrong status" });
        return;
      }

      socket.emit("job:statusUpdate", { jobId, status: "in_progress" });
      io.to(`user:${job.user}`).emit("job:statusUpdate", { jobId, status: "in_progress" });
    } catch (err) {
      console.error("technician:startJob error:", err.message);
    }
  });

  // Transition: in_progress → completed (work done)
  socket.on("technician:completeJob", async ({ jobId }) => {
    try {
      const technicianId = socket.data.technicianId;
      if (!technicianId) return;

      const job = await Job.findOneAndUpdate(
        { _id: jobId, technician: technicianId, status: "in_progress" },
        { $set: { status: "completed", completedAt: new Date() } },
        { new: true }
      );

      if (!job) {
        socket.emit("job:actionFailed", { jobId, reason: "Job not found or wrong status" });
        return;
      }

      // Free the technician
      await Technician.findByIdAndUpdate(technicianId, { currentJob: null });

      socket.emit("job:completed", { jobId });
      io.to(`user:${job.user}`).emit("job:completed", { jobId });
    } catch (err) {
      console.error("technician:completeJob error:", err.message);
    }
  });

  socket.on("disconnect", async () => {
    try {
      await Technician.findOneAndUpdate(
        { socketId: socket.id },
        { isOnline: false, socketId: null }
      );
    } catch (err) {
      console.error("disconnect cleanup error:", err.message);
    }
  });
};
