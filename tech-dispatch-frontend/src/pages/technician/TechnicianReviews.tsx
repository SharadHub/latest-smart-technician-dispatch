import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { Star, ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";
import type { Rating } from "../../types";

function StarRow({ value, total }: { value: number; total: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={16}
          className={n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-gray-200"}
        />
      ))}
      <span className="ml-1.5 text-sm font-semibold text-gray-900">{value.toFixed(1)}</span>
      <span className="ml-1 text-xs text-gray-400">({total} review{total !== 1 ? "s" : ""})</span>
    </div>
  );
}

export default function TechnicianReviews() {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [avg, setAvg] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ success: boolean; data: { ratings: Rating[]; averageRating: number; total: number } }>("/ratings/my")
      .then((res) => {
        setRatings(res.data.ratings);
        setAvg(res.data.averageRating);
        setTotal(res.data.total);
      })
      .catch(() => toast.error("Failed to load reviews"))
      .finally(() => setLoading(false));
  }, []);

  const starCounts = [5, 4, 3, 2, 1].map((s) => ({
    stars: s,
    count: ratings.filter((r) => r.stars === s).length,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to="/technician" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 no-underline mb-6">
          <ChevronLeft size={15} />Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Ratings & Reviews</h1>

        {loading ? (
          <div className="text-center py-16 text-sm text-gray-400">Loading...</div>
        ) : total === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <Star size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No reviews yet</p>
            <p className="text-sm text-gray-400 mt-1">Complete jobs to receive ratings from clients</p>
          </div>
        ) : (
          <>
            {/* Summary card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-5xl font-bold text-gray-900">{avg.toFixed(1)}</p>
                  <div className="flex gap-0.5 justify-center mt-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={18} className={n <= Math.round(avg) ? "fill-amber-400 text-amber-400" : "text-gray-200"} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{total} review{total !== 1 ? "s" : ""}</p>
                </div>

                <div className="flex-1 space-y-1.5">
                  {starCounts.map(({ stars, count }) => (
                    <div key={stars} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-4 text-right">{stars}</span>
                      <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" />
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all"
                          style={{ width: total > 0 ? `${(count / total) * 100}%` : "0%" }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-4">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Individual reviews */}
            <div className="space-y-3">
              {ratings.map((r) => {
                const client = typeof r.client === "object" && r.client !== null ? r.client as { name?: string } : null;
                const job = typeof r.job === "object" && r.job !== null ? r.job as { serviceType?: string; createdAt?: string } : null;
                return (
                  <div key={r._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                          {client?.name?.charAt(0).toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{client?.name || "Anonymous"}</p>
                          {job?.serviceType && (
                            <p className="text-xs text-gray-400 capitalize">{job.serviceType.replace(/_/g, " ")}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <StarRow value={r.stars} total={0} />
                        <p className="text-xs text-gray-400 mt-0.5">
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                        </p>
                      </div>
                    </div>
                    {r.review && (
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{r.review}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
