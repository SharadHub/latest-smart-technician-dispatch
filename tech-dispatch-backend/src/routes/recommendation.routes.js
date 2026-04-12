import express from "express";
import {
  getRecommendations,
  getRecommendationsByCity,
  getAvailableSkills,
  getTechnicianStats
} from "../controllers/recommendation.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

// Get technician recommendations based on location and skills
// GET /api/recommendations?lat=27.7172&lng=85.3240&skills=Electrician,Plumber&maxDistance=10&diverse=true&k=5
router.get("/", getRecommendations);

// Get recommendations by city name
// GET /api/recommendations/city?city=Kathmandu&skills=Electrician&diverse=true&k=3
router.get("/city", getRecommendationsByCity);

// Get all available skills for filtering
// GET /api/recommendations/skills
router.get("/skills", getAvailableSkills);

// Get technician statistics
// GET /api/recommendations/stats
router.get("/stats", getTechnicianStats);

export default router;
