import Technician from "../models/Technician.js";
import User from "../models/User.js";

class KNNRecommendation {
  constructor(k = 5) {
    this.k = k;
  }

  // Calculate distance between two points (latitude, longitude)
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Calculate skill similarity (Jaccard similarity)
  calculateSkillSimilarity(skills1, skills2) {
    const set1 = new Set(skills1.map(s => s.toLowerCase()));
    const set2 = new Set(skills2.map(s => s.toLowerCase()));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  // Normalize rating to 0-1 scale
  normalizeRating(rating) {
    return (rating - 1) / 4; // Assuming rating is 1-5 scale
  }

  // Calculate weighted distance for KNN
  calculateWeightedDistance(userLocation, requiredSkills, technician) {
    const techLocation = technician.location.coordinates;
    const techLat = techLocation[1];
    const techLng = techLocation[0];
    
    // Distance component (in km)
    const distance = this.calculateDistance(
      userLocation.lat, 
      userLocation.lng, 
      techLat, 
      techLng
    );
    
    // Normalize distance (closer is better, so we use inverse)
    // Max reasonable distance in Nepal is ~500km
    const normalizedDistance = Math.min(distance / 500, 1);
    
    // Skill similarity (higher is better)
    const skillSimilarity = requiredSkills.length > 0 
      ? this.calculateSkillSimilarity(requiredSkills, technician.skills)
      : 0.5; // Default if no skills specified
    
    // Rating component (higher is better)
    const normalizedRating = this.normalizeRating(technician.ratingAvg || 2.5);
    
    // Weighted distance formula
    // We want to minimize this "distance", so we use (1 - similarity) for components where higher is better
    const weights = {
      location: 0.4,    // 40% weight to location
      skills: 0.4,      // 40% weight to skills
      rating: 0.2       // 20% weight to rating
    };
    
    const weightedDistance = 
      weights.location * normalizedDistance +
      weights.skills * (1 - skillSimilarity) +
      weights.rating * (1 - normalizedRating);
    
    return {
      weightedDistance,
      distance,
      skillSimilarity,
      rating: technician.ratingAvg || 2.5
    };
  }

  // Get K nearest neighbors for recommendation
  async getRecommendations(userLocation, requiredSkills = [], filters = {}) {
    try {
      // Build query based on filters
      const query = { 
        approved: true, 
        status: "active" 
      };
      
      // Add skill filter if specified
      if (requiredSkills.length > 0) {
        query.skills = { $in: requiredSkills };
      }
      
      // Add location filter if maxDistance is specified
      let locationFilter = {};
      if (filters.maxDistance) {
        locationFilter = {
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [userLocation.lng, userLocation.lat]
              },
              $maxDistance: filters.maxDistance * 1000 // Convert to meters
            }
          }
        };
      }
      
      // Get technicians from database
      const technicians = await Technician.find({
        ...query,
        ...locationFilter
      })
      .populate("user", "name email phone location")
      .limit(100); // Limit to 100 for performance
      
      if (technicians.length === 0) {
        return [];
      }
      
      // Calculate distances for all technicians
      const techniciansWithDistance = technicians.map(tech => {
        const distanceData = this.calculateWeightedDistance(
          userLocation, 
          requiredSkills, 
          tech
        );
        
        return {
          ...tech.toObject(),
          ...distanceData
        };
      });
      
      // Sort by weighted distance (ascending - best recommendations first)
      techniciansWithDistance.sort((a, b) => 
        a.weightedDistance - b.weightedDistance
      );
      
      // Get top K recommendations
      const recommendations = techniciansWithDistance.slice(0, this.k);
      
      // Add recommendation scores
      return recommendations.map((tech, index) => ({
        ...tech,
        recommendationScore: (1 - tech.weightedDistance).toFixed(3),
        rank: index + 1,
        // Remove sensitive data
        user: {
          ...tech.user,
          password: undefined
        }
      }));
      
    } catch (error) {
      console.error("Error getting recommendations:", error);
      throw error;
    }
  }

  // Get recommendations by city name
  async getRecommendationsByCity(cityName, requiredSkills = [], filters = {}) {
    try {
      // Find a user in that city to get coordinates
      const sampleUser = await User.findOne({ 
        "location.city": cityName 
      }).select("location");
      
      if (!sampleUser) {
        throw new Error(`No users found in city: ${cityName}`);
      }
      
      return await this.getRecommendations(
        sampleUser.location, 
        requiredSkills, 
        filters
      );
      
    } catch (error) {
      console.error("Error getting recommendations by city:", error);
      throw error;
    }
  }

  // Get diverse recommendations (ensure skill diversity)
  async getDiverseRecommendations(userLocation, requiredSkills = [], filters = {}) {
    try {
      const recommendations = await this.getRecommendations(
        userLocation, 
        requiredSkills, 
        filters
      );
      
      // If we have fewer than k recommendations, return as is
      if (recommendations.length <= this.k) {
        return recommendations;
      }
      
      // Ensure skill diversity
      const diverseRecommendations = [];
      const usedSkills = new Set();
      
      // First, add technicians with unique primary skills
      for (const tech of recommendations) {
        const primarySkill = tech.skills[0];
        if (!usedSkills.has(primarySkill)) {
          diverseRecommendations.push(tech);
          usedSkills.add(primarySkill);
          
          if (diverseRecommendations.length >= this.k) {
            break;
          }
        }
      }
      
      // If we still need more, add the rest
      if (diverseRecommendations.length < this.k) {
        for (const tech of recommendations) {
          if (!diverseRecommendations.includes(tech)) {
            diverseRecommendations.push(tech);
            
            if (diverseRecommendations.length >= this.k) {
              break;
            }
          }
        }
      }
      
      return diverseRecommendations;
      
    } catch (error) {
      console.error("Error getting diverse recommendations:", error);
      throw error;
    }
  }
}

export default KNNRecommendation;
