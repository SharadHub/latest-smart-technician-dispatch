import express from "express";
import { createRating, getJobRating, getTechnicianRatings } from "../controllers/rating.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { isUser, isTechnician } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post("/jobs/:jobId", protect, isUser, createRating);
router.get("/jobs/:jobId", protect, getJobRating);
router.get("/my", protect, isTechnician, getTechnicianRatings);

export default router;
