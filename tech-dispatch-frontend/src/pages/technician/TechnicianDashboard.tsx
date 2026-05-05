import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { technicianService } from "../../services";
import { useSocketStore } from "../../store/socketStore";
import { useJobStore } from "../../store/jobStore";
import { Link } from "react-router-dom";
import { Wrench, Mail, Phone, CheckCircle, Clock, LogOut, Tag, Wifi, WifiOff, Star } from "lucide-react";
import type { Technician } from "../../types";
import JobNotification from "./JobNotification";

export default function TechnicianDashboard() {
  const { user, logout } = useAuthStore();
  const socket = useSocketStore((s) => s.socket);
  const setMyTechnicianId = useJobStore((s) => s.setMyTechnicianId);
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    technicianService.getProfile().then((res) => setTechnician(res.data)).catch(() => {});
  }, []);

  const handleGoOnline = () => {
    if (!technician || !socket) return;

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMyLocation(loc);
        setMyTechnicianId(technician._id);
        // technicianId is intentionally omitted — server derives it from the session
        socket.emit("technician:goOnline", { lat: loc.lat, lng: loc.lng });
        setIsOnline(true);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          alert("Location permission denied. Please allow location access in your browser settings.");
        } else if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
          alert("Location access requires a secure (HTTPS) connection in production.");
        } else {
          alert("Could not get your location. Please check your device settings.");
        }
      }
    );
  };

  const handleGoOffline = () => {
    if (!technician || !socket) return;
    // technicianId omitted — server uses socket.data.technicianId set during goOnline
    socket.emit("technician:goOffline");
    setIsOnline(false);
  };

  const handleLogout = async () => {
    if (socket && isOnline) {
      socket.emit("technician:goOffline");
    }
    await logout();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Wrench size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">TechDispatch</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
          <p className="text-gray-500 mt-1">Your technician profile.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-lg">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
              <Wrench size={30} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                {technician?.approved ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-50 text-green-600 text-xs font-medium rounded-full">
                    <CheckCircle size={12} />
                    Approved
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-600 text-xs font-medium rounded-full">
                    <Clock size={12} />
                    Pending Approval
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full ${isOnline ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                  {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </div>

          {/* Online / Offline toggle — only for approved technicians */}
          {technician?.approved && (
            <div className="mb-6">
              {isOnline ? (
                <button
                  onClick={handleGoOffline}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium text-sm rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  <WifiOff size={16} />
                  Go Offline
                </button>
              ) : (
                <button
                  onClick={handleGoOnline}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white font-medium text-sm rounded-xl hover:bg-green-700 transition-colors cursor-pointer"
                >
                  <Wifi size={16} />
                  Go Online — Accept Jobs
                </button>
              )}
              {isOnline && (
                <p className="text-xs text-gray-400 mt-2">You are visible to clients. New job requests will appear as a notification.</p>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <Mail size={18} className="text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Email</p>
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <Phone size={18} className="text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                <p className="text-sm font-medium text-gray-900">{user?.phone || "Not provided"}</p>
              </div>
            </div>

            {technician?.skills && technician.skills.length > 0 && (
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <Tag size={18} className="text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {technician.skills.map((skill) => (
                      <span key={skill} className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-lg capitalize">
                        {skill.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {!technician?.approved && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
              Your account is pending admin approval. You'll be notified once approved.
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-gray-100">
            <Link
              to="/technician/reviews"
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-medium hover:bg-amber-100 transition-colors no-underline"
            >
              <Star size={16} />
              View My Ratings & Reviews
            </Link>
          </div>
        </div>
      </main>

      {/* Job request overlay — only shown when online and a request comes in */}
      {isOnline && (
        <JobNotification
          technicianLocation={myLocation}
        />
      )}
    </div>
  );
}
