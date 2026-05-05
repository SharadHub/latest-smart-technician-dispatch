import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { isUser, isTechnician } from "../middlewares/role.middleware.js";
import {
  createJob,
  getMyJobs,
  getCurrentJob,
  getTechnicianCurrentJob,
  getJobById,
  cancelJob,
} from "../controllers/job.controller.js";

const router = express.Router();

router.post("/", protect, isUser, createJob);
router.get("/my", protect, isUser, getMyJobs);
router.get("/current", protect, isUser, getCurrentJob);
router.get("/technician/current", protect, isTechnician, getTechnicianCurrentJob);
router.get("/:id", protect, isUser, getJobById);
router.post("/:id/cancel", protect, isUser, cancelJob);

export default router;
