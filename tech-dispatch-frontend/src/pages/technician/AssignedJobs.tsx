import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getServiceByKey } from "../../config/services";
import Navbar from "../../components/layout/Navbar";
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AssignedBooking {
  _id: string;
  userId: { _id: string; name: string; email: string } | null;
  serviceType: string;
  status: string;
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
}

const statusConfig: Record<string, { color: string; bg: string; icon: typeof Clock }> = {
  requested: { color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
  accepted: { color: "text-blue-600", bg: "bg-blue-50", icon: CheckCircle },
  "in-progress": { color: "text-indigo-600", bg: "bg-indigo-50", icon: Loader2 },
  completed: { color: "text-green-600", bg: "bg-green-50", icon: CheckCircle },
  failed: { color: "text-red-600", bg: "bg-red-50", icon: XCircle },
  cancelled: { color: "text-gray-600", bg: "bg-gray-50", icon: XCircle },
  expired: { color: "text-orange-600", bg: "bg-orange-50", icon: AlertTriangle },
};

export default function AssignedJobs() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<AssignedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/technicians/bookings");
        setBookings(res.data.data);
      } catch {
        toast.error("Failed to load jobs");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleComplete = async (id: string) => {
    setActionId(id);
    try {
      await api.put(`/bookings/${id}/complete`);
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: "completed" } : b))
      );
      toast.success("Job marked as completed!");
    } catch {
      toast.error("Failed to complete job");
    } finally {
      setActionId(null);
    }
  };

  const handleFail = async (id: string) => {
    setActionId(id);
    try {
      await api.put(`/bookings/${id}/fail`);
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: "failed" } : b))
      );
      toast("Job marked as failed", { icon: "⚠️" });
    } catch {
      toast.error("Failed to update job");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate("/technician")}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-6 cursor-pointer border-none bg-transparent p-0"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-dark">My Assigned Jobs</h1>
          <p className="text-gray-500 mt-1">Jobs you have accepted</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20">
            <CheckCircle size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500">No assigned jobs yet</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {bookings.map((booking, i) => {
              const service = getServiceByKey(booking.serviceType);
              const sc = statusConfig[booking.status] || statusConfig.requested;
              const StatusIcon = sc.icon;

              return (
                <motion.div
                  key={booking._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-xl border border-gray-100 p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {service && (
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: service.bg }}
                        >
                          <service.icon size={24} style={{ color: service.color }} />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-dark">
                          {service?.label || booking.serviceType}
                        </h3>
                        {booking.userId && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Customer: {booking.userId.name} ({booking.userId.email})
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(booking.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.color}`}
                    >
                      <StatusIcon size={12} />
                      {booking.status}
                    </span>
                  </div>

                  {booking.status === "accepted" && (
                    <div className="mt-4 flex items-center gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleComplete(booking._id)}
                        disabled={actionId === booking._id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors cursor-pointer border-none text-sm disabled:opacity-50"
                      >
                        <CheckCircle size={14} />
                        Complete
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleFail(booking._id)}
                        disabled={actionId === booking._id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors cursor-pointer border-none text-sm disabled:opacity-50"
                      >
                        <XCircle size={14} />
                        Mark Failed
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
