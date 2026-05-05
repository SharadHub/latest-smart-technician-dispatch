import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { adminService } from "../../services";
import AdminLayout from "../../components/admin/AdminLayout";
import { ChevronLeft, AlertTriangle, CheckCircle, Clock, X } from "lucide-react";
import toast from "react-hot-toast";
import type { Technician, Job } from "../../types";

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-700",
  expired: "bg-gray-100 text-gray-500",
  searching: "bg-blue-50 text-blue-700",
  assigned: "bg-blue-50 text-blue-700",
  en_route: "bg-purple-50 text-purple-700",
  in_progress: "bg-amber-50 text-amber-700",
};

type Warning = { _id: string; reason: string; issuedAt: string };
type PopulatedUser = { name: string; email: string; phone?: string; warnings?: Warning[]; createdAt?: string };

function WarnModal({ tech, onClose, onSuccess }: { tech: Technician; onClose: () => void; onSuccess: () => void }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const name = tech.name || (typeof tech.user === "object" ? (tech.user as PopulatedUser).name : "Technician");

  const submit = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await adminService.warnTechnician(tech._id, reason.trim());
      toast.success("Warning issued");
      onSuccess();
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
          <h3 className="text-base font-semibold text-gray-900">Issue Warning — {name}</h3>
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

export default function TechnicianDetail() {
  const { id } = useParams<{ id: string }>();
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWarn, setShowWarn] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await adminService.getTechnicianActivity(id);
      setTechnician(res.data.technician);
      setJobs(res.data.jobs);
    } catch {
      toast.error("Failed to load technician activity");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const removeWarning = async (warningId: string) => {
    if (!technician) return;
    try {
      await adminService.removeTechnicianWarning(technician._id, warningId);
      load();
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

  if (!technician) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <p className="text-sm text-gray-500">Technician not found</p>
          <Link to="/admin/technicians" className="text-sm text-blue-600 hover:underline">← Back to technicians</Link>
        </div>
      </AdminLayout>
    );
  }

  const name = technician.name || (typeof technician.user === "object" ? (technician.user as PopulatedUser).name : "—");
  const email = technician.email || (typeof technician.user === "object" ? (technician.user as PopulatedUser).email : "—");
  const phone = technician.phone || (typeof technician.user === "object" ? (technician.user as PopulatedUser).phone : undefined);
  const warnings: Warning[] = typeof technician.user === "object" ? ((technician.user as PopulatedUser).warnings ?? []) : [];
  const joinedAt = typeof technician.user === "object" ? (technician.user as PopulatedUser).createdAt : technician.createdAt;

  const completedJobs = jobs.filter((j) => j.status === "completed").length;
  const cancelledJobs = jobs.filter((j) => j.status === "cancelled" || j.status === "expired").length;

  return (
    <AdminLayout>
      {showWarn && (
        <WarnModal tech={technician} onClose={() => setShowWarn(false)} onSuccess={load} />
      )}
      <div className="px-8 py-8 max-w-5xl">
        <Link to="/admin/technicians" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 no-underline mb-6">
          <ChevronLeft size={16} />Back to Technicians
        </Link>

        {/* Profile header */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-xl font-bold text-gray-600">
                {name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">{name}</h1>
                  {technician.approved ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 text-xs font-medium rounded-lg">
                      <CheckCircle size={11} />Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-xs font-medium rounded-lg">
                      <Clock size={11} />Pending Approval
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{email}</p>
                {phone && <p className="text-sm text-gray-500">{phone}</p>}
                <p className="text-xs text-gray-400 mt-1">Joined {joinedAt ? new Date(joinedAt).toLocaleDateString() : "—"}</p>
              </div>
            </div>
            <button
              onClick={() => setShowWarn(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-medium hover:bg-amber-100 transition-colors cursor-pointer"
            >
              <AlertTriangle size={15} />Issue Warning
            </button>
          </div>

          {/* Skills */}
          {technician.skills && technician.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-gray-100">
              {technician.skills.map((skill) => (
                <span key={skill} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg capitalize">
                  {skill.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Jobs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{completedJobs}</p>
              <p className="text-xs text-gray-500 mt-0.5">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{warnings.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Warnings</p>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6">
            <h2 className="text-sm font-semibold text-amber-800 mb-3">Active Warnings</h2>
            <div className="space-y-2">
              {warnings.map((w) => (
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
            <p className="text-xs text-gray-500 mt-0.5">{jobs.length} total · {completedJobs} completed · {cancelledJobs} failed/expired</p>
          </div>

          {jobs.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">No jobs yet</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Service</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const client = typeof job.user === "object" && job.user !== null ? job.user as { name?: string } : null;
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
                      <td className="px-6 py-3.5 text-sm text-gray-500">{client?.name || "—"}</td>
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
