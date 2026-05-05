import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { adminService } from "../../services";
import AdminLayout from "../../components/admin/AdminLayout";
import { ChevronLeft, AlertTriangle, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import type { User, Job } from "../../types";

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-700",
  expired: "bg-gray-100 text-gray-500",
  searching: "bg-blue-50 text-blue-700",
  assigned: "bg-blue-50 text-blue-700",
  en_route: "bg-purple-50 text-purple-700",
  in_progress: "bg-amber-50 text-amber-700",
};

function WarnModal({ user, onClose, onSuccess }: { user: User; onClose: () => void; onSuccess: (u: User) => void }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      const res = await adminService.warnUser(user._id, reason.trim());
      toast.success("Warning issued");
      onSuccess(res.data);
      onClose();
    } catch {
      toast.error("Failed to issue warning");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Issue Warning</h3>
          <button onClick={onClose} className="p-1 bg-transparent border-none cursor-pointer text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe the reason for this warning..."
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/40"
        />
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 bg-transparent cursor-pointer hover:bg-gray-50">Cancel</button>
          <button
            onClick={submit}
            disabled={!reason.trim() || loading}
            className="flex-1 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium cursor-pointer hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed border-none"
          >
            {loading ? "Issuing…" : "Issue Warning"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWarn, setShowWarn] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await adminService.getUserActivity(id);
      setUser(res.data.user);
      setJobs(res.data.jobs);
    } catch {
      toast.error("Failed to load user activity");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const removeWarning = async (warningId: string) => {
    if (!user) return;
    try {
      const res = await adminService.removeWarning(user._id, warningId);
      setUser(res.data);
      toast.success("Warning removed");
    } catch {
      toast.error("Failed to remove warning");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64 text-sm text-gray-400">Loading...</div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <p className="text-sm text-gray-500">User not found</p>
          <Link to="/admin/users" className="text-sm text-blue-600 hover:underline">← Back to users</Link>
        </div>
      </AdminLayout>
    );
  }

  const completedJobs = jobs.filter((j) => j.status === "completed").length;
  const cancelledJobs = jobs.filter((j) => j.status === "cancelled" || j.status === "expired").length;

  return (
    <AdminLayout>
      {showWarn && (
        <WarnModal user={user} onClose={() => setShowWarn(false)} onSuccess={(u) => setUser(u)} />
      )}
      <div className="px-8 py-8 max-w-5xl">
        <Link to="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 no-underline mb-6">
          <ChevronLeft size={16} />Back to Users
        </Link>

        {/* Profile header */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-xl font-bold text-gray-600">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-sm text-gray-500">{user.email}</p>
                {user.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                    user.role === "admin" ? "bg-purple-50 text-purple-700" :
                    user.role === "technician" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"
                  }`}>{user.role}</span>
                  <span className="text-xs text-gray-400">Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowWarn(true)}
              disabled={user.role === "admin"}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-medium hover:bg-amber-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <AlertTriangle size={15} />Issue Warning
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Jobs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{completedJobs}</p>
              <p className="text-xs text-gray-500 mt-0.5">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{user.warnings?.length ?? 0}</p>
              <p className="text-xs text-gray-500 mt-0.5">Warnings</p>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {(user.warnings?.length ?? 0) > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6">
            <h2 className="text-sm font-semibold text-amber-800 mb-3">Active Warnings</h2>
            <div className="space-y-2">
              {user.warnings!.map((w) => (
                <div key={w._id} className="flex items-start justify-between bg-white rounded-xl px-4 py-3 border border-amber-100">
                  <div>
                    <p className="text-sm text-gray-800">{w.reason}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(w.issuedAt).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => removeWarning(w._id)}
                    className="p-1 text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer shrink-0 ml-3"
                    title="Remove warning"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Job History */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Job History</h2>
            <p className="text-xs text-gray-500 mt-0.5">{jobs.length} total jobs · {completedJobs} completed · {cancelledJobs} failed/expired</p>
          </div>

          {jobs.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">No jobs yet</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Service</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Technician</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const tech = typeof job.technician === "object" && job.technician !== null ? job.technician : null;
                  return (
                    <tr key={job._id} className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors">
                      <td className="px-6 py-3.5">
                        <p className="text-sm font-medium text-gray-900 capitalize">{job.serviceType.replace(/_/g, " ")}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{job.description}</p>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[job.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {job.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-500">
                        {tech ? (tech as { name?: string; email?: string }).name || "—" : "—"}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-500">
                        {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
