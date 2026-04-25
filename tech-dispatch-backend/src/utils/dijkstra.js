// Kathmandu Valley road network graph for shortest path calculation

const NODES = [
  { id: 0,  name: "Kalanki",       lat: 27.6938, lng: 85.2798 },
  { id: 1,  name: "Swayambhu",     lat: 27.7146, lng: 85.2905 },
  { id: 2,  name: "Balkhu",        lat: 27.6840, lng: 85.2958 },
  { id: 3,  name: "Kalimati",      lat: 27.6960, lng: 85.2984 },
  { id: 4,  name: "New Road",      lat: 27.7054, lng: 85.3122 },
  { id: 5,  name: "Ratna Park",    lat: 27.7042, lng: 85.3145 },
  { id: 6,  name: "Thamel",        lat: 27.7156, lng: 85.3122 },
  { id: 7,  name: "Lazimpat",      lat: 27.7214, lng: 85.3194 },
  { id: 8,  name: "Balaju",        lat: 27.7320, lng: 85.3000 },
  { id: 9,  name: "Gongabu",       lat: 27.7355, lng: 85.3098 },
  { id: 10, name: "Maharajgunj",   lat: 27.7359, lng: 85.3268 },
  { id: 11, name: "Chabahil",      lat: 27.7175, lng: 85.3518 },
  { id: 12, name: "Bouddha",       lat: 27.7215, lng: 85.3618 },
  { id: 13, name: "Baneshwor",     lat: 27.6950, lng: 85.3348 },
  { id: 14, name: "Koteshwor",     lat: 27.6840, lng: 85.3479 },
  { id: 15, name: "Airport",       lat: 27.6958, lng: 85.3592 },
  { id: 16, name: "Thimi",         lat: 27.6839, lng: 85.3922 },
  { id: 17, name: "Bhaktapur",     lat: 27.6712, lng: 85.4298 },
  { id: 18, name: "Pulchowk",      lat: 27.6773, lng: 85.3189 },
  { id: 19, name: "Lagankhel",     lat: 27.6706, lng: 85.3251 },
  { id: 20, name: "Jawalakhel",    lat: 27.6780, lng: 85.3157 },
  { id: 21, name: "Satdobato",     lat: 27.6607, lng: 85.3353 },
  { id: 22, name: "Kupondole",     lat: 27.6860, lng: 85.3200 },
  { id: 23, name: "Bagbazar",      lat: 27.7042, lng: 85.3200 },
];

// Bidirectional road edges [nodeA, nodeB, distanceKm]
const EDGES = [
  [0,  1,  2.5],  // Kalanki – Swayambhu
  [0,  2,  1.8],  // Kalanki – Balkhu
  [0,  3,  1.5],  // Kalanki – Kalimati (Ring Road)
  [1,  4,  2.0],  // Swayambhu – New Road
  [1,  6,  2.2],  // Swayambhu – Thamel
  [1,  8,  3.0],  // Swayambhu – Balaju (Ring Road NW)
  [2,  3,  1.3],  // Balkhu – Kalimati
  [2,  18, 2.5],  // Balkhu – Pulchowk (Ekantakuna road)
  [3,  4,  1.8],  // Kalimati – New Road (Tripureshwor)
  [3,  22, 1.5],  // Kalimati – Kupondole
  [4,  5,  0.5],  // New Road – Ratna Park
  [4,  6,  1.2],  // New Road – Thamel
  [5,  22, 1.5],  // Ratna Park – Kupondole
  [5,  23, 0.8],  // Ratna Park – Bagbazar
  [6,  7,  1.2],  // Thamel – Lazimpat
  [6,  8,  2.0],  // Thamel – Balaju
  [7,  10, 1.8],  // Lazimpat – Maharajgunj
  [7,  23, 0.8],  // Lazimpat – Bagbazar (via Dillibazar)
  [8,  9,  0.8],  // Balaju – Gongabu
  [9,  10, 1.5],  // Gongabu – Maharajgunj
  [10, 11, 2.5],  // Maharajgunj – Chabahil (Ring Road E)
  [11, 12, 1.2],  // Chabahil – Bouddha
  [11, 13, 2.8],  // Chabahil – Baneshwor (Ring Road S)
  [12, 15, 3.2],  // Bouddha – Airport
  [13, 14, 2.0],  // Baneshwor – Koteshwor
  [13, 15, 2.5],  // Baneshwor – Airport
  [13, 22, 2.0],  // Baneshwor – Kupondole
  [13, 23, 1.0],  // Baneshwor – Bagbazar
  [14, 15, 1.5],  // Koteshwor – Airport
  [14, 16, 2.2],  // Koteshwor – Thimi
  [14, 19, 2.0],  // Koteshwor – Lagankhel (Ring Road)
  [15, 16, 2.5],  // Airport – Thimi
  [16, 17, 5.0],  // Thimi – Bhaktapur (Arniko Highway)
  [18, 19, 2.0],  // Pulchowk – Lagankhel
  [18, 20, 0.9],  // Pulchowk – Jawalakhel
  [18, 22, 1.2],  // Pulchowk – Kupondole
  [19, 20, 1.0],  // Lagankhel – Jawalakhel
  [19, 21, 1.5],  // Lagankhel – Satdobato
  [21, 14, 3.0],  // Satdobato – Koteshwor
  [23, 11, 2.2],  // Bagbazar – Chabahil (via Dillibazar)
];

// Build adjacency list once at module load
const GRAPH = Array.from({ length: NODES.length }, () => []);
for (const [a, b, w] of EDGES) {
  GRAPH[a].push({ to: b, weight: w });
  GRAPH[b].push({ to: a, weight: w });
}

class MinHeap {
  constructor() { this.heap = []; }

  push(item) {
    this.heap.push(item);
    this.#bubbleUp(this.heap.length - 1);
  }

  pop() {
    const top = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.#sinkDown(0);
    }
    return top;
  }

  get size() { return this.heap.length; }

  #bubbleUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent].dist <= this.heap[i].dist) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  #sinkDown(i) {
    const n = this.heap.length;
    while (true) {
      let min = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.heap[l].dist < this.heap[min].dist) min = l;
      if (r < n && this.heap[r].dist < this.heap[min].dist) min = r;
      if (min === i) break;
      [this.heap[min], this.heap[i]] = [this.heap[i], this.heap[min]];
      i = min;
    }
  }
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function snapToNearestNode(lat, lng) {
  let minDist = Infinity;
  let nearestId = 0;
  for (const node of NODES) {
    const d = haversine(lat, lng, node.lat, node.lng);
    if (d < minDist) { minDist = d; nearestId = node.id; }
  }
  return nearestId;
}

function runDijkstra(startId, endId) {
  const dist = new Array(NODES.length).fill(Infinity);
  const prev = new Array(NODES.length).fill(-1);
  dist[startId] = 0;

  const pq = new MinHeap();
  pq.push({ dist: 0, id: startId });

  while (pq.size > 0) {
    const { dist: d, id: u } = pq.pop();
    if (d > dist[u]) continue; // stale entry, skip
    if (u === endId) break;
    for (const { to, weight } of GRAPH[u]) {
      const nd = dist[u] + weight;
      if (nd < dist[to]) {
        dist[to] = nd;
        prev[to] = u;
        pq.push({ dist: nd, id: to });
      }
    }
  }

  if (dist[endId] === Infinity) return null;

  const nodeIds = [];
  let cur = endId;
  while (cur !== -1) { nodeIds.unshift(cur); cur = prev[cur]; }

  return { nodeIds, distance: dist[endId] };
}

/**
 * Find the shortest road path from technician location to user location.
 * Snaps both coordinates to the nearest city graph node, runs Dijkstra's,
 * then wraps the result with the exact GPS endpoints for full-route display.
 *
 * @returns {{ path: [number,number][], distance: number, waypoints: {name,lat,lng}[] }}
 */
export function getShortestPath(techLat, techLng, userLat, userLng) {
  const startId = snapToNearestNode(techLat, techLng);
  const endId   = snapToNearestNode(userLat, userLng);

  const result = runDijkstra(startId, endId);

  if (!result) {
    // Fallback: direct line when graph has no path (shouldn't happen in practice)
    return {
      path: [[techLat, techLng], [userLat, userLng]],
      distance: haversine(techLat, techLng, userLat, userLng),
      waypoints: [],
    };
  }

  const waypoints = result.nodeIds.map((id) => ({
    name: NODES[id].name,
    lat: NODES[id].lat,
    lng: NODES[id].lng,
  }));

  // Full path: exact tech GPS → road graph nodes → exact user GPS
  const path = [
    [techLat, techLng],
    ...result.nodeIds.map((id) => [NODES[id].lat, NODES[id].lng]),
    [userLat, userLng],
  ];

  return { path, distance: result.distance, waypoints };
}

export function calculateETA(distanceKm, speedKmh = 20) {
  return Math.round((distanceKm / speedKmh) * 60);
}
