import Technician from "../models/Technician.js";
import Job from "../models/Job.js";
import { getIO } from "../socket/index.js";
import { getRequiredSkills } from "../config/serviceSkillMap.js";

const SEARCH_RADIUS_METERS = parseInt(process.env.SEARCH_RADIUS_METERS) || 10000;
const PER_TECH_TIMEOUT_MS = parseInt(process.env.PER_TECH_TIMEOUT_MS) || 600000; // 10 minutes

async function findCandidates(serviceType, clientLng, clientLat) {
  const requiredSkills = getRequiredSkills(serviceType);

  return Technician.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [clientLng, clientLat] },
        distanceField: "distance",
        maxDistance: SEARCH_RADIUS_METERS,
        spherical: true,
        query: {
          isOnline: true,
          approved: true,
          status: "active",
          currentJob: null,
          skills: { $in: requiredSkills },
        },
      },
    },
    { $limit: 10 },
  ]);
}

export async function notifyNextTechnician(jobId) {
  const io = getIO();
  const job = await Job.findById(jobId).populate("user", "name phone _id");

  if (!job || job.status !== "searching") return;

  if (job.currentDispatchIndex >= job.dispatchQueue.length) {
    await Job.findByIdAndUpdate(jobId, { status: "expired" });
    io.to(`user:${job.user._id}`).emit("job:exhausted", { jobId });
    return;
  }

  const techId = job.dispatchQueue[job.currentDispatchIndex];
  const tech = await Technician.findById(techId);

  if (!tech || !tech.isOnline || !tech.socketId) {
    await Job.findByIdAndUpdate(jobId, { $inc: { currentDispatchIndex: 1 } });
    return notifyNextTechnician(jobId);
  }

  io.to(`technician:${techId}`).emit("technician:jobRequest", {
    jobId: job._id,
    serviceType: job.serviceType,
    description: job.description,
    clientLocation: job.clientLocation.coordinates, // [lng, lat]
    clientAddress: job.clientAddress,
    clientName: job.user.name,
    clientPhone: job.user.phone,
    timeoutMs: PER_TECH_TIMEOUT_MS,
  });

  await Job.findByIdAndUpdate(jobId, {
    $addToSet: { notifiedTechnicians: techId },
  });

  const capturedIndex = job.currentDispatchIndex;

  setTimeout(async () => {
    try {
      const current = await Job.findById(jobId);
      if (
        current &&
        current.status === "searching" &&
        current.currentDispatchIndex === capturedIndex
      ) {
        await Job.findByIdAndUpdate(jobId, { $inc: { currentDispatchIndex: 1 } });
        notifyNextTechnician(jobId).catch(console.error);
      }
    } catch (err) {
      console.error("per-tech timeout error:", err.message);
    }
  }, PER_TECH_TIMEOUT_MS);
}

export async function dispatchJob(job) {
  const io = getIO();
  const [clientLng, clientLat] = job.clientLocation.coordinates;
  const candidates = await findCandidates(job.serviceType, clientLng, clientLat);

  if (candidates.length === 0) {
    await Job.findByIdAndUpdate(job._id, { status: "expired" });
    io.to(`user:${job.user}`).emit("job:exhausted", { jobId: job._id });
    return;
  }

  await Job.findByIdAndUpdate(job._id, {
    dispatchQueue: candidates.map((c) => c._id),
    currentDispatchIndex: 0,
  });

  notifyNextTechnician(job._id).catch(console.error);
}
