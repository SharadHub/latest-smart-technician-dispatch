/**
 * KNN (K-Nearest Neighbors) algorithm for technician dispatch
 */

import Technician from "../models/Technician.js";
import {
  calculateDistance,
  calculateDistanceScore,
} from "./geo.js";
import {
  calculateSkillMatch,
  calculateRatingScore,
} from "./scoring.js";

const DEFAULT_K = 5;
const DEFAULT_MAX_DISTANCE = 50;
const WEIGHTS = { distance: 0.4, skill: 0.4, rating: 0.2 };

/**
 * Find K nearest technicians using MongoDB $geoNear + scoring
 * @param {number[]} userLocation - [longitude, latitude]
 * @param {string} serviceType - Service requested
 * @param {number} k - Number of results
 * @param {number} maxDistance - Max radius in km
 * @returns {Promise<Array>} Ranked technicians with scores
 */
export const findKNearestTechnicians = async (
  userLocation,
  serviceType,
  k = DEFAULT_K,
  maxDistance = DEFAULT_MAX_DISTANCE
) => {
  // MongoDB spatial query - find technicians within radius
  const technicians = await Technician.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: userLocation },
        distanceField: "distance",
        maxDistance: maxDistance * 1000, // km to meters
        spherical: true,
        query: { approved: true, status: "active" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userData",
      },
    },
    { $unwind: "$userData" },
    { $limit: 20 },
  ]);

  if (!technicians.length) return [];

  // Calculate weighted KNN scores
  const scored = technicians.map((tech) => {
    const distanceKm = tech.distance / 1000;
    const distanceScore = calculateDistanceScore(distanceKm, maxDistance);
    const skillScore = calculateSkillMatch(serviceType, tech.skills);
    const ratingScore = calculateRatingScore(tech.ratingAvg);

    const knnScore =
      distanceScore * WEIGHTS.distance +
      skillScore * WEIGHTS.skill +
      ratingScore * WEIGHTS.rating;

    return {
      technician: {
        _id: tech._id,
        user: tech.userData,
        skills: tech.skills,
        ratingAvg: tech.ratingAvg,
        ratingCount: tech.ratingCount,
        location: tech.location,
      },
      distance: distanceKm,
      distanceScore,
      skillScore,
      ratingScore,
      knnScore,
    };
  });

  // Sort by KNN score and return top K
  return scored.sort((a, b) => b.knnScore - a.knnScore).slice(0, k);
};
