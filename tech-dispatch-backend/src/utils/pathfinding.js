/**
 * KNN-inspired shortest path algorithm
 * Calculates optimal route between technician and user
 */

// Haversine distance calculation (km)
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// KNN-based path scoring
export const calculateKNNPath = (
  startLat,
  startLng,
  endLat,
  endLng,
  waypoints = [],
  k = 3
) => {
  // Build candidate points including start, end, and any intermediate waypoints
  const candidates = [
    { lat: startLat, lng: startLng, score: 0 },
    { lat: endLat, lng: endLng, score: 1 },
    ...waypoints.map((wp) => ({
      lat: wp.lat,
      lng: wp.lng,
      score: 0.5,
    })),
  ];

  const path = [[startLat, startLng]];
  let current = { lat: startLat, lng: startLng };
  const visited = new Set([0]);

  while (visited.size < candidates.length) {
    let nearestIdx = -1;
    let minDistance = Infinity;

    for (let i = 0; i < candidates.length; i++) {
      if (visited.has(i)) continue;

      const candidate = candidates[i];
      const dist = calculateDistance(
        current.lat,
        current.lng,
        candidate.lat,
        candidate.lng
      );

      const score = dist * (1 - candidate.score * 0.3);

      if (score < minDistance) {
        minDistance = score;
        nearestIdx = i;
      }
    }

    if (nearestIdx === -1) break;

    const next = candidates[nearestIdx];
    path.push([next.lat, next.lng]);
    visited.add(nearestIdx);
    current = { lat: next.lat, lng: next.lng };
  }

  return path;
};

// Generate smooth path with intermediate points
export const generateSmoothPath = (start, end, numPoints = 20) => {
  const path = [start];

  for (let i = 1; i < numPoints; i++) {
    const ratio = i / numPoints;
    const lat = start[0] + (end[0] - start[0]) * ratio;
    const lng = start[1] + (end[1] - start[1]) * ratio;
    path.push([lat, lng]);
  }

  path.push(end);
  return path;
};

// Calculate estimated time
export const calculateETA = (distanceKm, speedKmh = 30) => {
  return Math.round((distanceKm / speedKmh) * 60);
};
