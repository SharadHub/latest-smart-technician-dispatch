import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminService } from "../../services";
import AdminLayout from "../../components/admin/AdminLayout";
import { CheckCircle, Clock, Trash2, Search, ChevronLeft, ChevronRight, AlertTriangle, X } from "lucide-react";
import toast from "react-hot-toast";
import type { Technician } from "../../types";

function WarnModal({ tech, onClose, onSuccess }: { tech: Technician; onClose: () => void; onSuccess: () => void }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

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

  const name = tech.name || (typeof tech.user === "object" ? tech.user.name : "Technician");

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

export default function TechniciansList() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [warnTarget, setWarnTarget] = useState<Technician | null>(null);

  const fetchTechnicians = async (p = page, q = search) => {
    setLoading(true);
    try {
      const res = await adminService.getTechnicians(p, 10, q);
      setTechnicians(res.data);
      setPages(res.pages);
      setTotal(res.total);
    } catch {
      toast.error("Failed to load technicians");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTechnicians(1, search); setPage(1); }, [search]);
  useEffect(() => { fetchTechnicians(page, search); }, [page]);

  const handleApprove = async (id: string) => {
    try {
      await adminService.verifyTechnician(id);
      toast.success("Technician approved");
      fetchTechnicians(page, search);
    } catch {
      toast.error("Failed to approve technician");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this technician and their user account? This cannot be undone.")) return;
    try {
      await adminService.deleteTechnician(id);
      toast.success("Technician deleted");
      fetchTechnicians(page, search);
    } catch {
      toast.error("Failed to delete technician");
    }
  };

  const getName = (tech: Technician) => tech.name || (typeof tech.user === "object" ? tech.user.name : "Unknown");
  const getEmail = (tech: Technician) => tech.email || (typeof tech.user === "object" ? tech.user.email : "—");
  const getWarnings = (tech: Technician) =>
    typeof tech.user === "object" ? (tech.user.warnings?.length ?? 0) : 0;

  return (
    <AdminLayout>
      {warnTarget && (
        <WarnModal
          tech={warnTarget}
          onClose={() => setWarnTarget(null)}
          onSuccess={() => fetchTechnicians(page, search)}
        />
      )}
      <div className="px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Technicians</h1>
            <p className="text-sm text-gray-500 mt-0.5">{total} total technicians</p>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 w-72"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-sm text-gray-400">Loading...</div>
        ) : technicians.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-400">No technicians found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {technicians.map((tech) => (
              <div key={tech._id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <Link to={`/admin/technicians/${tech._id}`} className="flex items-center gap-3 no-underline group flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
                      {getName(tech).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">{getName(tech)}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{getEmail(tech)}</p>
                    </div>
                  </Link>

                  {tech.approved ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-lg shrink-0 ml-2">
                      <CheckCircle size={11} />Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 text-xs font-medium rounded-lg shrink-0 ml-2">
                      <Clock size={11} />Pending
                    </span>
                  )}
                </div>

                {tech.skills && tech.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {tech.skills.slice(0, 4).map((skill) => (
                      <span key={skill} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md capitalize">
                        {skill.replace(/_/g, " ")}
                      </span>
                    ))}
                    {tech.skills.length > 4 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-md">+{tech.skills.length - 4}</span>
                    )}
                  </div>
                )}

                {getWarnings(tech) > 0 && (
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">
                      <AlertTriangle size={11} />
                      {getWarnings(tech)} warning{getWarnings(tech) > 1 ? "s" : ""}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleApprove(tech._id)}
                    disabled={tech.approved}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors border-none cursor-pointer ${
                      tech.approved ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-900 text-white hover:bg-gray-700"
                    }`}
                  >
                    {tech.approved ? "Approved" : "Approve"}
                  </button>
                  <button
                    onClick={() => setWarnTarget(tech)}
                    className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors bg-transparent border-none cursor-pointer"
                    title="Issue warning"
                  >
                    <AlertTriangle size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(tech._id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors bg-transparent border-none cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-500">Page {page} of {pages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed bg-transparent cursor-pointer">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed bg-transparent cursor-pointer">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
