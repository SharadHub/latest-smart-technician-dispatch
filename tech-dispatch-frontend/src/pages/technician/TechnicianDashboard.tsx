import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTechnicianBookingStore } from "../../store/technicianBookingStore";
import { getServiceByKey } from "../../config/services";
import { initSocket, disconnectSocket, subscribe } from "../../socket";
import { useAuthStore } from "../../store/authStore";
import { bookingService } from "../../services";
import { technicianService } from "../../services";
import Navbar from "../../components/layout/Navbar";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import {
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Bell,
  Briefcase,
  Star,
  User,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import type { SocketBookingRequestPayload, SocketBookingUpdatePayload } from "../../types";

export default function TechnicianDashboard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const bookings = useTechnicianBookingStore((s) => s.bookings);
  const addBooking = useTechnicianBookingStore((s) => s.addBooking);
  const removeBooking = useTechnicianBookingStore((s) => s.removeBooking);

  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Timer for countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Socket connection
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    initSocket(token, user._id, user.role);

    const unsubscribeRequest = subscribe("booking-request", (data) => {
      const payload = data as SocketBookingRequestPayload;
      addBooking({
        bookingId: payload.bookingId,
        serviceType: payload.serviceType,
        expiresAt: payload.expiresAt,
      });
      toast("New job request!", { icon: "🔔" });
    });

    const unsubscribeUpdate = subscribe("booking-updated", (data) => {
      const payload = data as SocketBookingUpdatePayload;
      if (payload.status !== "requested") {
        removeBooking(payload.bookingId);
      }
    });

    return () => {
      unsubscribeRequest();
      unsubscribeUpdate();
      disconnectSocket();
    };
  }, [isAuthenticated, user, addBooking, removeBooking]);

  // Fetch availability
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await technicianService.getProfile();
        setIsAvailable(profile.status === "active");
      } catch {
        // not yet approved
      }
    };
    fetchProfile();
  }, []);

  const handleAccept = async (bookingId: string) => {
    setAcceptingId(bookingId);
    try {
      await bookingService.acceptBooking(bookingId);
      toast.success("Booking accepted!");
    } catch (err: unknown) {
      const error = err as { response?: { status: number } };
      if (error.response?.status === 409) {
        toast.error("Already accepted by another technician");
        removeBooking(bookingId);
      }
    } finally {
      setAcceptingId(null);
    }
  };

  const handleReject = async (bookingId: string) => {
    setRejectingId(bookingId);
    try {
      await bookingService.rejectBooking(bookingId);
      removeBooking(bookingId);
      toast("Booking rejected", { icon: "❌" });
    } catch {
      toast.error("Failed to reject");
    } finally {
      setRejectingId(null);
    }
  };

  const handleToggleAvailability = async () => {
    setToggling(true);
    try {
      const result = await technicianService.toggleAvailability();
      setIsAvailable(result.status === "active");
      toast.success(
        result.status === "active"
          ? "You are now available"
          : "You are now offline"
      );
    } catch {
      toast.error("Failed to toggle availability");
    } finally {
      setToggling(false);
    }
  };

  const formatTime = (ms: number) => {
    if (ms <= 0) return "Expired";
    const hrs = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-bold text-dark">
              Technician Dashboard
            </h1>
            <p className="text-gray-500 mt-1">
              Manage incoming job requests
            </p>
          </motion.div>

          <div className="flex items-center gap-4">
            {/* Availability Toggle */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleAvailability}
              disabled={toggling}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm cursor-pointer border-none transition-colors ${
                isAvailable
                  ? "bg-green-50 text-green-600"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {isAvailable ? (
                <ToggleRight size={20} />
              ) : (
                <ToggleLeft size={20} />
              )}
              {isAvailable ? "Available" : "Offline"}
            </motion.button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link to="/technician/jobs" className="no-underline">
            <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Briefcase size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-dark">My Jobs</p>
                <p className="text-xs text-gray-400">View assigned jobs</p>
              </div>
            </div>
          </Link>
          <Link to="/technician/ratings" className="no-underline">
            <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Star size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-dark">My Ratings</p>
                <p className="text-xs text-gray-400">View your reviews</p>
              </div>
            </div>
          </Link>
          <Link to="/technician/profile" className="no-underline">
            <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <User size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-dark">Profile</p>
                <p className="text-xs text-gray-400">Manage your profile</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Incoming Requests */}
        <div className="flex items-center gap-2 mb-4">
          <Bell size={18} className="text-primary" />
          <h2 className="text-lg font-semibold text-dark">
            Incoming Requests
          </h2>
          {bookings.length > 0 && (
            <span className="px-2 py-0.5 bg-primary text-white text-xs font-medium rounded-full">
              {bookings.length}
            </span>
          )}
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <Bell size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500">No pending requests</p>
            <p className="text-xs text-gray-400 mt-1">
              New job requests will appear here in real-time
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {bookings.map((booking) => {
                const service = getServiceByKey(booking.serviceType);
                const remaining = new Date(booking.expiresAt).getTime() - now;

                return (
                  <motion.div
                    key={booking.bookingId}
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, x: -20 }}
                    className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        {service && (
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: service.bg }}
                          >
                            <service.icon
                              size={24}
                              style={{ color: service.color }}
                            />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-dark">
                            {service?.label || booking.serviceType}
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {service?.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-amber-600">
                        <Clock size={14} />
                        <span className="text-xs font-medium">
                          {formatTime(remaining)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAccept(booking.bookingId)}
                        disabled={acceptingId === booking.bookingId}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors cursor-pointer border-none text-sm disabled:opacity-50"
                      >
                        {acceptingId === booking.bookingId ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <CheckCircle size={14} />
                        )}
                        Accept
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleReject(booking.bookingId)}
                        disabled={rejectingId === booking.bookingId}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-600 font-medium rounded-lg hover:bg-gray-200 transition-colors cursor-pointer border-none text-sm disabled:opacity-50"
                      >
                        <XCircle size={14} />
                        Reject
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
