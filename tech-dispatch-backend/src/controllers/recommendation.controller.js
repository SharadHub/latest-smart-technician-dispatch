import KNNRecommendation from "../utils/knnRecommendation.js";

const knn = new KNNRecommendation(5); // Get top 5 recommendations

// Get technician recommendations based on user location and required skills
export const getRecommendations = async (req, res) => {
  try {
    const { 
      lat, 
      lng, 
      skills = [], 
      maxDistance, 
      diverse = false,
      k = 5 
    } = req.query;

    // Validate required parameters
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required"
      });
    }

    // Parse parameters
    const userLocation = {
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    };

    const requiredSkills = Array.isArray(skills) ? skills : 
                          (skills ? skills.split(',').map(s => s.trim()) : []);

    const filters = {
      maxDistance: maxDistance ? parseFloat(maxDistance) : undefined
    };

    // Update k if provided
    if (k && k !== '5') {
      knn.k = parseInt(k);
    }

    let recommendations;
    if (diverse === 'true') {
      recommendations = await knn.getDiverseRecommendations(
        userLocation, 
        requiredSkills, 
        filters
      );
    } else {
      recommendations = await knn.getRecommendations(
        userLocation, 
        requiredSkills, 
        filters
      );
    }

    res.status(200).json({
      success: true,
      count: recommendations.length,
      data: recommendations
    });

  } catch (error) {
    console.error("Error getting recommendations:", error);
    res.status(500).json({
      success: false,
      message: "Server error while getting recommendations",
      error: error.message
    });
  }
};

// Get recommendations by city name
export const getRecommendationsByCity = async (req, res) => {
  try {
    const { 
      city, 
      skills = [], 
      maxDistance, 
      diverse = false,
      k = 5 
    } = req.query;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: "City name is required"
      });
    }

    const requiredSkills = Array.isArray(skills) ? skills : 
                          (skills ? skills.split(',').map(s => s.trim()) : []);

    const filters = {
      maxDistance: maxDistance ? parseFloat(maxDistance) : undefined
    };

    // Update k if provided
    if (k && k !== '5') {
      knn.k = parseInt(k);
    }

    let recommendations;
    if (diverse === 'true') {
      recommendations = await knn.getDiverseRecommendationsByCity(
        city, 
        requiredSkills, 
        filters
      );
    } else {
      recommendations = await knn.getRecommendationsByCity(
        city, 
        requiredSkills, 
        filters
      );
    }

    res.status(200).json({
      success: true,
      city: city,
      count: recommendations.length,
      data: recommendations
    });

  } catch (error) {
    console.error("Error getting recommendations by city:", error);
    res.status(500).json({
      success: false,
      message: "Server error while getting recommendations",
      error: error.message
    });
  }
};

// Get available skills for filtering
export const getAvailableSkills = async (req, res) => {
  try {
    const Technician = (await import("../models/Technician.js")).default;
    
    // Get all unique skills from active technicians
    const skills = await Technician.distinct("skills", { 
      approved: true, 
      status: "active" 
    });

    res.status(200).json({
      success: true,
      count: skills.length,
      data: skills.sort()
    });

  } catch (error) {
    console.error("Error getting available skills:", error);
    res.status(500).json({
      success: false,
      message: "Server error while getting available skills",
      error: error.message
    });
  }
};

// Get technician statistics
export const getTechnicianStats = async (req, res) => {
  try {
    const Technician = (await import("../models/Technician.js")).default;
    
    const stats = await Technician.aggregate([
      {
        $match: { approved: true }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
          },
          busy: {
            $sum: { $cond: [{ $eq: ["$status", "busy"] }, 1, 0] }
          },
          inactive: {
            $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] }
          },
          avgRating: { $avg: "$ratingAvg" },
          totalRatings: { $sum: "$ratingCount" }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      active: 0,
      busy: 0,
      inactive: 0,
      avgRating: 0,
      totalRatings: 0
    };

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("Error getting technician stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error while getting technician stats",
      error: error.message
    });
  }
};
