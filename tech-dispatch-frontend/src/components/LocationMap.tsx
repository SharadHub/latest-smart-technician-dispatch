import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/128/684/684908.png",
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
});

const techIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/128/1995/1995574.png",
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
});

function MapBounds({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [50, 50] });
  }, [bounds, map]);
  return null;
}

interface Waypoint {
  name: string;
  lat: number;
  lng: number;
}

interface LocationMapProps {
  userLocation: [number, number];   // [lat, lng]
  techLocation?: [number, number];  // [lat, lng]
  path?: [number, number][];        // Dijkstra path as [lat, lng] points
  waypoints?: Waypoint[];           // Named road nodes along the path
  height?: string;
}

export default function LocationMap({
  userLocation,
  techLocation,
  path,
  waypoints,
  height = "400px",
}: LocationMapProps) {
  const [bounds, setBounds] = useState<L.LatLngBoundsExpression | null>(null);

  useEffect(() => {
    const points: L.LatLngTuple[] = [userLocation];
    if (techLocation) points.push(techLocation);
    setBounds(L.latLngBounds(points.map((p) => [p[0], p[1]])));
  }, [userLocation, techLocation]);

  const hasDijkstraPath = path && path.length > 1;

  return (
    <MapContainer
      center={userLocation}
      zoom={14}
      style={{ height, width: "100%", borderRadius: "12px" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* User marker */}
      <Marker position={userLocation} icon={userIcon}>
        <Popup>
          <div className="text-sm">
            <strong>Your Location</strong>
            <br />
            {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
          </div>
        </Popup>
      </Marker>

      {/* Technician marker */}
      {techLocation && (
        <Marker position={techLocation} icon={techIcon}>
          <Popup>
            <div className="text-sm">
              <strong>Technician Location</strong>
              <br />
              {techLocation[0].toFixed(4)}, {techLocation[1].toFixed(4)}
            </div>
          </Popup>
        </Marker>
      )}

      {/* Dijkstra shortest path (solid green) */}
      {hasDijkstraPath && (
        <Polyline positions={path} color="#10B981" weight={5} opacity={0.9} />
      )}

      {/* Fallback straight line when no Dijkstra path yet */}
      {!hasDijkstraPath && techLocation && (
        <Polyline
          positions={[techLocation, userLocation]}
          color="#3B82F6"
          weight={3}
          opacity={0.6}
          dashArray="8, 8"
        />
      )}

      {/* Road graph waypoint dots with name popups */}
      {waypoints && waypoints.slice(1, -1).map((wp, i) => (
        <CircleMarker
          key={i}
          center={[wp.lat, wp.lng]}
          radius={4}
          pathOptions={{ color: "#059669", fillColor: "#10B981", fillOpacity: 1, weight: 1.5 }}
        >
          <Popup>
            <span className="text-xs font-medium">{wp.name}</span>
          </Popup>
        </CircleMarker>
      ))}

      <MapBounds bounds={bounds} />
    </MapContainer>
  );
}
