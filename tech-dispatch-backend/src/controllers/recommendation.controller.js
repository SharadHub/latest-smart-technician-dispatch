import { findNearestTechnicians } from "../utils/findNearestTechnician.js";
import Technician from "../models/Technician.js";

export const getRecommendations = async (req, res) => {
  try {
    const { lat, lng, limit = 5, maxDistance } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: "lat and lng are required" });
    }

    const userLocation = [parseFloat(lng), parseFloat(lat)]; // [lng, lat] for MongoDB
    const results = await findNearestTechnicians(
      userLocation,
      parseInt(limit),
      maxDistance ? parseFloat(maxDistance) : undefined
    );

    res.status(200).json({ success: true, count: results.length, data: results });
  } catch (error) {
    console.error("Error getting recommendations:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const getAvailableSkills = async (req, res) => {
  try {
    const skills = await Technician.distinct("skills", { approved: true, status: "active" });
    res.status(200).json({ success: true, count: skills.length, data: skills.sort() });
  } catch (error) {
    console.error("Error getting skills:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const getTechnicianStats = async (req, res) => {
  try {
    const stats = await Technician.aggregate([
      { $match: { approved: true } },
      {
        $group: {
          _id: null,
          total:        { $sum: 1 },
          active:       { $sum: { $cond: [{ $eq: ["$status", "active"] },   1, 0] } },
          busy:         { $sum: { $cond: [{ $eq: ["$status", "busy"] },     1, 0] } },
          inactive:     { $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] } },
          avgRating:    { $avg: "$ratingAvg" },
          totalRatings: { $sum: "$ratingCount" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || { total: 0, active: 0, busy: 0, inactive: 0, avgRating: 0, totalRatings: 0 },
    });
  } catch (error) {
    console.error("Error getting technician stats:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
