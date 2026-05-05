import Rating from "../models/Rating.js";
import Job from "../models/Job.js";
import Technician from "../models/Technician.js";

export const createRating = async (req, res, next) => {
  try {
    const { stars, review } = req.body;

    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ success: false, message: "Stars must be between 1 and 5" });
    }

    const job = await Job.findOne({ _id: req.params.jobId, user: req.user._id, status: "completed" });
    if (!job) {
      return res.status(404).json({ success: false, message: "Completed job not found" });
    }
    if (job.rating) {
      return res.status(409).json({ success: false, message: "This job has already been rated" });
    }

    const rating = await Rating.create({
      job: job._id,
      technician: job.technician,
      client: req.user._id,
      stars: parseInt(stars, 10),
      review: review?.trim() || "",
    });

    await Job.findByIdAndUpdate(job._id, { rating: rating._id });

    res.status(201).json({ success: true, data: rating });
  } catch (err) {
    next(err);
  }
};

export const getJobRating = async (req, res, next) => {
  try {
    const rating = await Rating.findOne({ job: req.params.jobId });
    res.json({ success: true, data: rating || null });
  } catch (err) {
    next(err);
  }
};

export const getTechnicianRatings = async (req, res, next) => {
  try {
    const tech = await Technician.findOne({ user: req.user._id });
    if (!tech) return res.status(404).json({ success: false, message: "Technician not found" });

    const ratings = await Rating.find({ technician: tech._id })
      .populate("client", "name")
      .populate("job", "serviceType createdAt")
      .sort("-createdAt");

    const total = ratings.length;
    const avg = total > 0 ? ratings.reduce((s, r) => s + r.stars, 0) / total : 0;

    res.json({ success: true, data: { ratings, averageRating: Math.round(avg * 10) / 10, total } });
  } catch (err) {
    next(err);
  }
};
