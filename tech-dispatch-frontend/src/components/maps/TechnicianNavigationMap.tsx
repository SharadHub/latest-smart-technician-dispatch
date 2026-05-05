import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LocationCoords } from "../../types";

const clientIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const technicianIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// On first render fit both markers in view. On subsequent tech moves, pan to keep
// the technician visible without yanking the map away from what the user is looking at.
function TrackTechnician({
  techLoc,
  clientLoc,
}: {
  techLoc: LocationCoords;
  clientLoc: LocationCoords;
}) {
  const map = useMap();
  const initialFit = useRef(false);
  const prevTech = useRef(techLoc);

  useEffect(() => {
    if (!initialFit.current) {
      // First load — fit both markers with padding
      map.fitBounds(
        [
          [techLoc.lat, techLoc.lng],
          [clientLoc.lat, clientLoc.lng],
        ],
        { padding: [50, 50], maxZoom: 16 }
      );
      initialFit.current = true;
      prevTech.current = techLoc;
      return;
    }

    // Subsequent location updates — pan smoothly to the technician only when they've
    // actually moved (avoid re-centering on floating-point GPS jitter)
    const moved =
      Math.abs(techLoc.lat - prevTech.current.lat) > 0.00005 ||
      Math.abs(techLoc.lng - prevTech.current.lng) > 0.00005;

    if (moved) {
      map.panTo([techLoc.lat, techLoc.lng], { animate: true, duration: 0.8 });
      prevTech.current = techLoc;
    }
  }, [techLoc.lat, techLoc.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

interface TechnicianNavigationMapProps {
  technicianLocation: LocationCoords;
  clientLocation: LocationCoords;
}

export default function TechnicianNavigationMap({
  technicianLocation,
  clientLocation,
}: TechnicianNavigationMapProps) {
  const polyline: [number, number][] = [
    [technicianLocation.lat, technicianLocation.lng],
    [clientLocation.lat, clientLocation.lng],
  ];

  return (
    <MapContainer
      center={[technicianLocation.lat, technicianLocation.lng]}
      zoom={14}
      style={{ height: "380px", width: "100%", borderRadius: "16px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Technician marker — green, follows GPS */}
      <Marker position={[technicianLocation.lat, technicianLocation.lng]} icon={technicianIcon}>
        <Popup>Your location</Popup>
      </Marker>

      {/* Client destination marker — blue, fixed */}
      <Marker position={[clientLocation.lat, clientLocation.lng]} icon={clientIcon}>
        <Popup>Client location</Popup>
      </Marker>

      {/* Dashed route line */}
      <Polyline positions={polyline} color="#ef4444" weight={3} dashArray="8 4" />

      <TrackTechnician techLoc={technicianLocation} clientLoc={clientLocation} />
    </MapContainer>
  );
}
