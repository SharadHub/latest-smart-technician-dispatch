import cron from "node-cron";
import Job from "../models/Job.js";
import { getIO } from "../socket/index.js";

export const startJobExpiryScheduler = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      const expiredJobs = await Job.find({
        status: "searching",
        expiresAt: { $lt: now },
      }).populate("user", "_id");

      if (expiredJobs.length === 0) return;

      const io = getIO();

      for (const job of expiredJobs) {
        const updated = await Job.findOneAndUpdate(
          { _id: job._id, status: "searching" },
          { $set: { status: "expired" } },
          { new: true }
        );

        if (!updated) continue;

        io.to(`user:${job.user._id}`).emit("job:expired", { jobId: job._id });

        for (const techId of job.notifiedTechnicians || []) {
          io.to(`technician:${techId}`).emit("technician:jobCancelled", {
            jobId: job._id,
            reason: "expired",
          });
        }
      }
    } catch (err) {
      console.error("Job expiry scheduler error:", err.message);
    }
  });

  console.log("Job expiry scheduler started (runs every 60s)");
};
