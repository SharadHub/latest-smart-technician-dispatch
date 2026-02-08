import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../../components/layout/Navbar";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Star, Loader2, ArrowLeft, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Rating {
  _id: string;
  score: number;
  comment?: string;
  userId: { _id: string; name: string } | null;
  bookingId: { _id: string; serviceType: string } | null;
  createdAt: string;
}

export default function TechnicianRatings() {
  const navigate = useNavigate();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/technicians/ratings");
        setRatings(res.data.data);
      } catch {
        toast.error("Failed to load ratings");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const avgRating =
    ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length).toFixed(1)
      : "0.0";

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
          <h1 className="text-2xl font-bold text-dark">My Ratings</h1>
          <p className="text-gray-500 mt-1">See what customers think of your work</p>
        </motion.div>

        {/* Overall Rating Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 bg-white rounded-xl border border-gray-100 p-6"
        >
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-dark">{avgRating}</div>
              <div className="flex items-center gap-0.5 mt-1 justify-center">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={16}
                    className={
                      s <= Math.round(Number(avgRating))
                        ? "text-amber-400 fill-amber-400"
                        : "text-gray-200"
                    }
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {ratings.length} review{ratings.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratings.filter((r) => r.score === star).length;
                const pct = ratings.length > 0 ? (count / ratings.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-4">{star}</span>
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="h-full bg-amber-400 rounded-full"
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-6">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Individual Ratings */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : ratings.length === 0 ? (
          <div className="text-center py-16">
            <Star size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500">No ratings yet</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {ratings.map((rating, i) => (
              <motion.div
                key={rating._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="bg-white rounded-xl border border-gray-100 p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          className={
                            s <= rating.score
                              ? "text-amber-400 fill-amber-400"
                              : "text-gray-200"
                          }
                        />
                      ))}
                    </div>
                    <p className="text-sm font-medium text-dark">
                      {rating.userId?.name || "Anonymous"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {rating.bookingId?.serviceType || "Service"} &middot;{" "}
                      {new Date(rating.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                {rating.comment && (
                  <div className="mt-3 flex items-start gap-2">
                    <MessageSquare size={14} className="text-gray-300 mt-0.5 shrink-0" />
                    <p className="text-sm text-gray-600">{rating.comment}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
