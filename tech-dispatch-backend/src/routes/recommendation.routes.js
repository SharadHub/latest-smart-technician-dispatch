import express from "express";
import {
  getRecommendations,
  getAvailableSkills,
  getTechnicianStats,
} from "../controllers/recommendation.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

// GET /api/recommendations?lat=27.7172&lng=85.3240&limit=5&maxDistance=50
router.get("/", getRecommendations);

// GET /api/recommendations/skills
router.get("/skills", getAvailableSkills);

// GET /api/recommendations/stats
router.get("/stats", getTechnicianStats);

export default router;
