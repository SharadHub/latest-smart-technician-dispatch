import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBookingStore } from "../../store/bookingStore";
import { getServiceByKey } from "../../config/services";
import Navbar from "../../components/layout/Navbar";
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Star,
  X,
} from "lucide-react";
import { initSocket, disconnectSocket } from "../../socket";
import { useAuthStore } from "../../store/authStore";

const statusConfig: Record<string, { color: string; bg: string; icon: typeof Clock }> = {
  requested: { color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
  accepted: { color: "text-blue-600", bg: "bg-blue-50", icon: CheckCircle },
  "in-progress": { color: "text-indigo-600", bg: "bg-indigo-50", icon: Loader2 },
  completed: { color: "text-green-600", bg: "bg-green-50", icon: CheckCircle },
  failed: { color: "text-red-600", bg: "bg-red-50", icon: XCircle },
  cancelled: { color: "text-gray-600", bg: "bg-gray-50", icon: XCircle },
  expired: { color: "text-orange-600", bg: "bg-orange-50", icon: AlertTriangle },
  rejected: { color: "text-red-600", bg: "bg-red-50", icon: XCircle },
};

export default function MyBookings() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const { bookings, setBookings, updateBooking, setLoading, loading } = useBookingStore();
  const [ratingModal, setRatingModal] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const res = await api.get("/bookings");
        setBookings(res.data.data);
      } catch {
        toast.error("Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [setBookings, setLoading]);

  // Socket for real-time updates
  useEffect(() => {
    if (!token || !user) return;

    const socket = initSocket(token);
    socket.emit("join", { userId: user.id, role: "user" });

    socket.on("booking-updated", (payload: { bookingId: string; status: string }) => {
      updateBooking(payload.bookingId, { status: payload.status as typeof bookings[0]["status"] });
      if (payload.status === "accepted") {
        toast.success("A technician accepted your booking!");
      } else if (payload.status === "completed") {
        toast.success("Your service has been completed!");
      }
    });

    return () => {
      socket.off("booking-updated");
      disconnectSocket();
    };
  }, [token, user, updateBooking]);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await api.put(`/bookings/${id}/cancel`);
      updateBooking(id, { status: "cancelled" });
      toast.success("Booking cancelled");
    } catch {
      toast.error("Cannot cancel this booking");
    } finally {
      setCancellingId(null);
    }
  };

  const handleRate = async (bookingId: string) => {
    setSubmittingRating(true);
    try {
      const booking = bookings.find((b) => b._id === bookingId);
      const techId = typeof booking?.technicianId === "object" ? booking?.technicianId?._id : booking?.technicianId;
      await api.post("/bookings/" + bookingId + "/rate", {
        score: rating,
        comment,
        technicianId: techId,
      });
      toast.success("Thanks for your rating!");
      setRatingModal(null);
      setRating(5);
      setComment("");
    } catch {
      toast.error("Failed to submit rating");
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-dark">My Bookings</h1>
          <p className="text-gray-500 mt-1">Track all your service requests</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20">
            <Clock size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No bookings yet</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <AnimatePresence>
              {bookings.map((booking) => {
                const service = getServiceByKey(booking.serviceType);
                const status = statusConfig[booking.status] || statusConfig.requested;
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    key={booking._id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
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
                            {new Date(booking.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {typeof booking.technicianId === "object" &&
                            booking.technicianId && (
                              <p className="text-xs text-gray-500 mt-1">
                                Technician: {booking.technicianId.name}
                              </p>
                            )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}
                        >
                          <StatusIcon size={12} />
                          {booking.status}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center gap-2">
                      {booking.status === "requested" && (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleCancel(booking._id)}
                          disabled={cancellingId === booking._id}
                          className="px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer border-none disabled:opacity-50"
                        >
                          {cancellingId === booking._id
                            ? "Cancelling..."
                            : "Cancel"}
                        </motion.button>
                      )}
                      {booking.status === "completed" && (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setRatingModal(booking._id)}
                          className="px-3 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer border-none flex items-center gap-1"
                        >
                          <Star size={12} />
                          Rate Service
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Rating Modal */}
      <AnimatePresence>
        {ratingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setRatingModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-dark">
                  Rate the Service
                </h3>
                <button
                  onClick={() => setRatingModal(null)}
                  className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer border-none bg-transparent"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="cursor-pointer border-none bg-transparent p-0"
                  >
                    <Star
                      size={32}
                      className={
                        star <= rating
                          ? "text-amber-400 fill-amber-400"
                          : "text-gray-200"
                      }
                    />
                  </button>
                ))}
              </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Leave a comment (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRate(ratingModal)}
                disabled={submittingRating}
                className="w-full mt-4 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors cursor-pointer border-none text-sm disabled:opacity-50"
              >
                {submittingRating ? "Submitting..." : "Submit Rating"}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
