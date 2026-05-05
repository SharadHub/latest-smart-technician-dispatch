import Job from "../models/Job.js";
import Technician from "../models/Technician.js";
import { dispatchJob } from "../services/dispatchService.js";
import { getIO } from "../socket/index.js";

const JOB_EXPIRY_MINUTES = parseInt(process.env.JOB_EXPIRY_MINUTES) || 15;
const ACTIVE_STATUSES = ["searching", "assigned", "en_route", "in_progress"];

export const createJob = async (req, res, next) => {
  try {
    const { serviceType, description, lat, lng, clientAddress } = req.body;

    // Prevent job spam — one active job per user
    const existing = await Job.findOne({ user: req.user._id, status: { $in: ACTIVE_STATUSES } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You already have an active job request.",
      });
    }

    const job = await Job.create({
      user: req.user._id,
      serviceType,
      description,
      clientLocation: {
        type: "Point",
        coordinates: [parseFloat(lng), parseFloat(lat)], // GeoJSON: [lng, lat]
      },
      clientAddress,
      status: "searching",
      expiresAt: new Date(Date.now() + JOB_EXPIRY_MINUTES * 60 * 1000),
    });

    res.status(201).json({ success: true, data: job });

    // Dispatch async — after response sent
    dispatchJob(job).catch((err) =>
      console.error(`Dispatch failed for job ${job._id}:`, err.message)
    );
  } catch (err) {
    next(err);
  }
};

export const getMyJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ user: req.user._id })
      .populate("technician", "name phone email")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: jobs });
  } catch (err) {
    next(err);
  }
};

export const getCurrentJob = async (req, res, next) => {
  try {
    const job = await Job.findOne({ user: req.user._id, status: { $in: ACTIVE_STATUSES } })
      .populate("technician", "name phone email location");
    res.json({ success: true, data: job || null });
  } catch (err) {
    next(err);
  }
};

export const getTechnicianCurrentJob = async (req, res, next) => {
  try {
    const tech = await Technician.findOne({ user: req.user._id });
    if (!tech) return res.status(404).json({ success: false, message: "Technician not found." });

    const job = await Job.findOne({ technician: tech._id, status: { $in: ACTIVE_STATUSES } })
      .populate("user", "name phone");
    res.json({ success: true, data: job || null });
  } catch (err) {
    next(err);
  }
};

export const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, user: req.user._id })
      .populate("technician", "name phone email");
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
};

export const cancelJob = async (req, res, next) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, status: { $in: ["searching", "assigned"] } },
      { $set: { status: "cancelled" } },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found or cannot be cancelled." });
    }

    // Free technician if one was assigned
    if (job.technician) {
      await Technician.findByIdAndUpdate(job.technician, { currentJob: null });
      const io = getIO();
      io.to(`technician:${job.technician}`).emit("technician:jobCancelled", {
        jobId: job._id,
        reason: "client_cancelled",
      });
    }

    // Notify all technicians who were notified
    if (job.notifiedTechnicians?.length) {
      const io = getIO();
      for (const techId of job.notifiedTechnicians) {
        io.to(`technician:${techId}`).emit("technician:jobCancelled", {
          jobId: job._id,
          reason: "client_cancelled",
        });
      }
    }

    res.json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
};
