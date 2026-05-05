import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { Link } from "react-router-dom";
import { User, Mail, Phone, ShieldCheck, LogOut, Wrench, ChevronRight, Star } from "lucide-react";
import { jobService } from "../../services/jobService";
import type { Job } from "../../types";

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-700",
  expired: "bg-gray-100 text-gray-500",
  searching: "bg-blue-50 text-blue-700",
  assigned: "bg-blue-50 text-blue-700",
  en_route: "bg-purple-50 text-purple-700",
  in_progress: "bg-amber-50 text-amber-700",
};

export default function UserDashboard() {
  const { user, logout } = useAuthStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    jobService.getMyJobs()
      .then((res) => setJobs(res.data))
      .catch(() => {})
      .finally(() => setLoadingJobs(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const completedJobs = jobs.filter((j) => j.status === "completed");
  const activeJob = jobs.find((j) => ["searching", "assigned", "en_route", "in_progress"].includes(j.status));

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
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
            <p className="text-gray-500 mt-1">Here is your account and service history.</p>
          </div>
          <div className="flex items-center gap-2">
            {activeJob && (
              <Link
                to="/track"
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white font-semibold text-sm rounded-xl hover:bg-amber-600 transition-colors no-underline shrink-0"
              >
                Track Active Job
                <ChevronRight size={16} />
              </Link>
            )}
            <Link
              to="/book"
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-colors no-underline shrink-0"
            >
              Book a Service
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <User size={22} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">{user?.name}</h2>
                <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full capitalize">
                  <ShieldCheck size={11} />
                  {user?.role}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Mail size={15} className="text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Phone size={15} className="text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{user?.phone || "Not provided"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <ShieldCheck size={15} className="text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Member since</p>
                  <p className="text-sm font-medium text-gray-900">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Job history */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Job History</h2>
              <span className="text-xs text-gray-400">{jobs.length} total</span>
            </div>

            {loadingJobs ? (
              <div className="px-6 py-12 text-center text-sm text-gray-400">Loading...</div>
            ) : jobs.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Wrench size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No jobs yet</p>
                <Link to="/book" className="text-sm text-blue-600 hover:underline mt-1 inline-block">Book your first service</Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {jobs.slice(0, 10).map((job) => {
                  const tech = typeof job.technician === "object" && job.technician !== null
                    ? job.technician as { name?: string }
                    : null;
                  const isRatable = job.status === "completed" && !job.rating;
                  return (
                    <div key={job._id} className="px-6 py-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 capitalize">{job.serviceType.replace(/_/g, " ")}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{job.description}</p>
                        {tech?.name && <p className="text-xs text-gray-500 mt-0.5">Technician: {tech.name}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[job.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {job.status.replace(/_/g, " ")}
                        </span>
                        {isRatable && (
                          <Link
                            to={`/rate/${job._id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors no-underline"
                          >
                            <Star size={11} />
                            Rate
                          </Link>
                        )}
                        {job.status === "completed" && job.rating && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gray-50 text-gray-500 rounded-lg text-xs">
                            <Star size={11} className="fill-amber-400 text-amber-400" />
                            Rated
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {completedJobs.length > 0 && (
              <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/50">
                <p className="text-xs text-gray-400">{completedJobs.length} completed job{completedJobs.length !== 1 ? "s" : ""}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
