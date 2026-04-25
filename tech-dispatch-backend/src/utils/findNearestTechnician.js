import Technician from "../models/Technician.js";

const DEFAULT_MAX_DISTANCE_KM = 50;

/**
 * Find the single nearest active technician to the given location.
 * Uses MongoDB $geoNear which sorts by distance automatically.
 *
 * @param {[number, number]} userLocation - [longitude, latitude]
 * @param {number} maxDistanceKm
 * @returns {Promise<{ technician: object, distanceKm: number } | null>}
 */
export const findNearestTechnician = async (
  userLocation,
  maxDistanceKm = DEFAULT_MAX_DISTANCE_KM
) => {
  const results = await Technician.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: userLocation },
        distanceField: "distance",
        maxDistance: maxDistanceKm * 1000, // km → metres
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
    { $limit: 1 },
  ]);

  if (!results.length) return null;

  const tech = results[0];
  return {
    technician: {
      _id: tech._id,
      user: tech.userData,
      skills: tech.skills,
      ratingAvg: tech.ratingAvg,
      ratingCount: tech.ratingCount,
      location: tech.location,
    },
    distanceKm: tech.distance / 1000,
  };
};

/**
 * Find the N nearest active technicians sorted by distance (closest first).
 * Used by the recommendation API.
 *
 * @param {[number, number]} userLocation - [longitude, latitude]
 * @param {number} limit
 * @param {number} maxDistanceKm
 * @returns {Promise<Array<{ technician: object, distanceKm: number }>>}
 */
export const findNearestTechnicians = async (
  userLocation,
  limit = 5,
  maxDistanceKm = DEFAULT_MAX_DISTANCE_KM
) => {
  const results = await Technician.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: userLocation },
        distanceField: "distance",
        maxDistance: maxDistanceKm * 1000,
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
    { $limit: limit },
  ]);

  return results.map((tech, index) => ({
    rank: index + 1,
    distanceKm: parseFloat((tech.distance / 1000).toFixed(2)),
    technician: {
      _id: tech._id,
      user: tech.userData,
      skills: tech.skills,
      ratingAvg: tech.ratingAvg,
      ratingCount: tech.ratingCount,
      location: tech.location,
    },
  }));
};
