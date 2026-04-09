/**
 * Geo-spatial utilities for KNN algorithm
 */

const R = 6371; // Earth's radius in kilometers

const toRad = (degrees) => degrees * (Math.PI / 180);

/**
 * Calculate Haversine distance between two coordinates
 * @param {number[]} loc1 - [longitude, latitude]
 * @param {number[]} loc2 - [longitude, latitude]
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (loc1, loc2) => {
  const [lng1, lat1] = loc1;
  const [lng2, lat2] = loc2;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Calculate distance score (inverse - closer is better)
 * @param {number} distanceKm - Distance in km
 * @param {number} maxDistance - Maximum search radius
 * @returns {number} Score between 0 and 1
 */
export const calculateDistanceScore = (distanceKm, maxDistance) =>
  Math.max(0, 1 - distanceKm / maxDistance);
