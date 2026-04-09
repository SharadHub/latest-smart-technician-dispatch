import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons
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

// Auto-center map on markers
function MapBounds({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

interface LocationMapProps {
  userLocation: [number, number]; // [lat, lng]
  techLocation?: [number, number]; // [lat, lng]
  path?: [number, number][]; // Array of [lat, lng] waypoints
  height?: string;
  showPath?: boolean;
}

export default function LocationMap({
  userLocation,
  techLocation,
  path,
  height = "400px",
  showPath = true,
}: LocationMapProps) {
  const [bounds, setBounds] = useState<L.LatLngBoundsExpression | null>(null);

  useEffect(() => {
    const points: L.LatLngTuple[] = [userLocation];
    if (techLocation) {
      points.push(techLocation);
    }
    if (points.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBounds(L.latLngBounds(points.map((p) => [p[0], p[1]])));
    }
  }, [userLocation, techLocation]);

  // Default center is user location
  const center: L.LatLngTuple = userLocation;

  return (
    <MapContainer
      center={center}
      zoom={14}
      style={{ height, width: "100%", borderRadius: "12px" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* User Marker */}
      <Marker position={userLocation} icon={userIcon}>
        <Popup>
          <div className="text-sm">
            <strong>Your Location</strong>
            <br />
            {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
          </div>
        </Popup>
      </Marker>

      {/* Technician Marker */}
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

      {/* Path between user and technician */}
      {showPath && techLocation && (
        <Polyline
          positions={[userLocation, techLocation]}
          color="#3B82F6"
          weight={4}
          opacity={0.8}
          dashArray="10, 10"
        />
      )}

      {/* Custom path from KNN algorithm */}
      {path && path.length > 0 && (
        <Polyline
          positions={path}
          color="#10B981"
          weight={5}
          opacity={0.9}
        />
      )}

      <MapBounds bounds={bounds} />
    </MapContainer>
  );
}
