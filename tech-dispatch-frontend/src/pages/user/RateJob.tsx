import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../../api/client";
import { Star, ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";
import type { Job, Rating } from "../../types";

export default function RateJob() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [existing, setExisting] = useState<Rating | null>(null);
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    Promise.all([
      api.get<{ success: boolean; data: Job }>(`/jobs/${jobId}`),
      api.get<{ success: boolean; data: Rating | null }>(`/ratings/jobs/${jobId}`),
    ])
      .then(([jobRes, ratingRes]) => {
        setJob(jobRes.data);
        if (ratingRes.data) {
          setExisting(ratingRes.data);
          setStars(ratingRes.data.stars);
          setReview(ratingRes.data.review || "");
        }
      })
      .catch(() => toast.error("Failed to load job"))
      .finally(() => setLoading(false));
  }, [jobId]);

  const submit = async () => {
    if (stars === 0) { toast.error("Please select a star rating"); return; }
    if (!jobId) return;
    setSubmitting(true);
    try {
      await api.post(`/ratings/jobs/${jobId}`, { stars, review });
      toast.success("Rating submitted!");
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-sm text-gray-400">Loading...</p>
    </div>
  );

  if (!job || job.status !== "completed") return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
      <p className="text-sm text-gray-500">This job cannot be rated</p>
      <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">Back to dashboard</Link>
    </div>
  );

  const tech = typeof job.technician === "object" && job.technician !== null
    ? job.technician as { name?: string }
    : null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 no-underline mb-6">
          <ChevronLeft size={15} />Back
        </Link>

        <h1 className="text-xl font-bold text-gray-900 mb-1">
          {existing ? "Your Rating" : "Rate Your Technician"}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {tech?.name ? `Service by ${tech.name}` : "Rate the completed service"}
          {" · "}
          <span className="capitalize">{job.serviceType.replace(/_/g, " ")}</span>
        </p>

        {/* Star picker */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              disabled={!!existing}
              onClick={() => !existing && setStars(n)}
              onMouseEnter={() => !existing && setHover(n)}
              onMouseLeave={() => !existing && setHover(0)}
              className={`p-0 bg-transparent border-none transition-transform ${!existing ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
            >
              <Star
                size={36}
                className={`transition-colors ${n <= (hover || stars) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
              />
            </button>
          ))}
        </div>

        {stars > 0 && (
          <p className="text-sm font-medium text-gray-700 mb-4">
            {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][stars]}
          </p>
        )}

        <textarea
          value={review}
          onChange={(e) => !existing && setReview(e.target.value)}
          disabled={!!existing}
          placeholder="Leave a review (optional)..."
          rows={3}
          maxLength={500}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900/10 mb-4 disabled:bg-gray-50 disabled:text-gray-500"
        />

        {!existing ? (
          <button
            onClick={submit}
            disabled={stars === 0 || submitting}
            className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
          >
            {submitting ? "Submitting…" : "Submit Rating"}
          </button>
        ) : (
          <div className="py-3 text-center text-sm text-gray-500 bg-gray-50 rounded-xl">
            Rating already submitted
          </div>
        )}
      </div>
    </div>
  );
}
