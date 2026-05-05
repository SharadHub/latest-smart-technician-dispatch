import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, MapPin, Wrench, Phone, Clock, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useSocketStore } from "../../store/socketStore";
import { useSocketEvent } from "../../hooks/useSocketEvents";
import { useJobStore } from "../../store/jobStore";
import { fromGeoJSON } from "../../utils/coords";
import { getServiceByKey } from "../../config/services";

interface IncomingJob {
  jobId: string;
  serviceType: string;
  description: string;
  clientLocation: [number, number]; // [lng, lat]
  clientAddress?: string;
  clientName: string;
  clientPhone: string;
  timeoutMs: number;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface JobNotificationProps {
  technicianLocation: { lat: number; lng: number } | null;
}

export default function JobNotification({ technicianLocation }: JobNotificationProps) {
  const navigate = useNavigate();
  const socket = useSocketStore((s) => s.socket);
  const setActiveJob = useJobStore((s) => s.setActiveJob);
  const setClientLocation = useJobStore((s) => s.setClientLocation);

  const [incoming, setIncoming] = useState<IncomingJob | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [responding, setResponding] = useState(false);

  useSocketEvent("technician:jobRequest", (data: IncomingJob) => {
    setIncoming(data);
    setSecondsLeft(Math.floor(data.timeoutMs / 1000));
    toast("New job request!", { icon: "🔔" });
  });

  useSocketEvent("technician:jobCancelled", (data: { jobId: string; reason: string }) => {
    if (incoming && data.jobId === incoming.jobId) {
      setIncoming(null);
      if (data.reason === "client_cancelled") toast("Job was cancelled by the client.");
      else if (data.reason === "expired") toast("Job request expired.");
      else setIncoming(null);
    }
  });

  // Countdown timer
  useEffect(() => {
    if (!incoming) return;
    if (secondsLeft <= 0) {
      setIncoming(null);
      return;
    }
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [incoming, secondsLeft]);

  const handleAccept = () => {
    if (!incoming || !socket) return;
    setResponding(true);
    // technicianId omitted — server uses socket.data.technicianId from session
    socket.emit("technician:acceptJob", { jobId: incoming.jobId });

    socket.once("job:acceptSuccess", (data: {
      jobId: string;
      clientName: string;
      clientPhone: string;
      clientLocation: [number, number];
      clientAddress?: string;
      serviceType: string;
      description: string;
    }) => {
      const { lat, lng } = fromGeoJSON(data.clientLocation);
      setClientLocation({ lat, lng });
      setActiveJob({
        _id: data.jobId,
        user: data.clientName,
        technician: null,
        serviceType: data.serviceType,
        description: data.description,
        clientLocation: { type: "Point", coordinates: data.clientLocation },
        clientAddress: data.clientAddress,
        status: "assigned",
        expiresAt: "",
      });
      setIncoming(null);
      setResponding(false);
      toast.success("Job accepted!");
      navigate("/technician/job");
    });

    socket.once("job:acceptFailed", (data: { reason: string }) => {
      setIncoming(null);
      setResponding(false);
      toast.error(data.reason === "already_assigned" ? "Job was already taken." : "Could not accept job.");
    });
  };

  const handleReject = () => {
    if (!incoming || !socket) return;
    socket.emit("technician:rejectJob", { jobId: incoming.jobId });
    setIncoming(null);
    setSecondsLeft(0);
  };

  if (!incoming) return null;

  const service = getServiceByKey(incoming.serviceType);
  const clientCoords = fromGeoJSON(incoming.clientLocation);
  const distKm =
    technicianLocation
      ? haversineKm(technicianLocation.lat, technicianLocation.lng, clientCoords.lat, clientCoords.lng)
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Bell size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-lg">New Job Request</h2>
            <p className="text-xs text-gray-400">Respond before the timer runs out</p>
          </div>
          <div className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-amber-50 rounded-full">
            <Clock size={14} className="text-amber-500" />
            <span className="text-sm font-mono font-bold text-amber-600">{formatCountdown(secondsLeft)}</span>
          </div>
        </div>

        {/* Service type */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: service?.bg || "#f1f5f9" }}
          >
            {service ? <service.icon size={18} style={{ color: service.color }} /> : <Wrench size={18} className="text-gray-400" />}
          </div>
          <div>
            <p className="text-xs text-gray-400">Service</p>
            <p className="text-sm font-semibold text-gray-900">{service?.label || incoming.serviceType}</p>
          </div>
          {distKm !== null && (
            <div className="ml-auto text-right">
              <p className="text-xs text-gray-400">Distance</p>
              <p className="text-sm font-bold text-blue-600">{distKm.toFixed(1)} km</p>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="p-3 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-400 mb-1">Issue description</p>
          <p className="text-sm text-gray-700">{incoming.description}</p>
        </div>

        {/* Client info */}
        <div className="flex gap-3">
          <div className="flex-1 p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400 mb-0.5">Client</p>
            <p className="text-sm font-medium text-gray-900">{incoming.clientName}</p>
          </div>
          {incoming.clientAddress && (
            <div className="flex-1 p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
                <MapPin size={11} />Address
              </p>
              <p className="text-sm text-gray-700 truncate">{incoming.clientAddress}</p>
            </div>
          )}
        </div>

        {/* Contact */}
        <a
          href={`tel:${incoming.clientPhone}`}
          className="flex items-center gap-2 text-sm text-blue-600 no-underline"
        >
          <Phone size={14} />
          {incoming.clientPhone}
        </a>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleReject}
            disabled={responding}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <XCircle size={16} />
            Reject
          </button>
          <button
            onClick={handleAccept}
            disabled={responding}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle size={16} />
            {responding ? "Accepting…" : "Accept"}
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 transition-all duration-1000"
            style={{ width: `${(secondsLeft / Math.floor(incoming.timeoutMs / 1000)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
