import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fromGeoJSON } from "../../utils/coords";
import type { Job, LocationCoords } from "../../types";

const clientIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const technicianIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// On first render fit both markers. On tech movement re-fit so both stay visible —
// unless the user has manually panned (tracked via a moved flag).
function TrackBoth({
  techLoc,
  clientLoc,
}: {
  techLoc: LocationCoords;
  clientLoc: LocationCoords;
}) {
  const map = useMap();
  const initialFit = useRef(false);
  const userPanned = useRef(false);
  const prevTech = useRef(techLoc);

  // Detect manual user pan/zoom and stop auto-fitting
  useEffect(() => {
    const onDrag = () => { userPanned.current = true; };
    map.on("dragstart", onDrag);
    return () => { map.off("dragstart", onDrag); };
  }, [map]);

  useEffect(() => {
    if (!initialFit.current) {
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

    if (userPanned.current) return; // respect manual pan

    const moved =
      Math.abs(techLoc.lat - prevTech.current.lat) > 0.00005 ||
      Math.abs(techLoc.lng - prevTech.current.lng) > 0.00005;

    if (moved) {
      // Re-fit to keep both markers visible as tech approaches
      map.fitBounds(
        [
          [techLoc.lat, techLoc.lng],
          [clientLoc.lat, clientLoc.lng],
        ],
        { padding: [50, 50], maxZoom: 16, animate: true }
      );
      prevTech.current = techLoc;
    }
  }, [techLoc.lat, techLoc.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

interface ClientTrackingMapProps {
  job: Job;
  technicianLocation: LocationCoords | null;
  jobStatus?: string;
}

export default function ClientTrackingMap({ job, technicianLocation, jobStatus }: ClientTrackingMapProps) {
  const client = fromGeoJSON(job.clientLocation.coordinates);
  const techLoc = technicianLocation;

  const polyline: [number, number][] = techLoc
    ? [[client.lat, client.lng], [techLoc.lat, techLoc.lng]]
    : [];

  const techPopupLabel =
    jobStatus === "in_progress" ? "Technician is working here" : "Technician is on the way";

  return (
    <MapContainer
      center={[client.lat, client.lng]}
      zoom={14}
      style={{ height: "380px", width: "100%", borderRadius: "16px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Client's own pin — blue */}
      <Marker position={[client.lat, client.lng]} icon={clientIcon}>
        <Popup>Your location</Popup>
      </Marker>

      {/* Technician pin — red, moves in real time */}
      {techLoc && (
        <>
          <Marker position={[techLoc.lat, techLoc.lng]} icon={technicianIcon}>
            <Popup>{techPopupLabel}</Popup>
          </Marker>
          <Polyline
            positions={polyline}
            color="#3b82f6"
            weight={3}
            dashArray="8 4"
          />
          <TrackBoth techLoc={techLoc} clientLoc={client} />
        </>
      )}
    </MapContainer>
  );
}
