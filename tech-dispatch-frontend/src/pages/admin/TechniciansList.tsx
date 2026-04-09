import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../../components/layout/Navbar";
import { adminService } from "../../services";
import toast from "react-hot-toast";
import type { Technician } from "../../types";
import {
  Wrench,
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TechniciansList() {
  const navigate = useNavigate();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTechnicians = async (p: number) => {
    setLoading(true);
    try {
      const res = await adminService.getTechnicians(p, 10);
      setTechnicians(res.data);
      setTotalPages(res.pages);
    } catch {
      toast.error("Failed to load technicians");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicians(page);
  }, [page]);

  const handleVerify = async (id: string) => {
    setActionId(id);
    try {
      await adminService.verifyTechnician(id);
      setTechnicians((prev) =>
        prev.map((t) => (t._id === id ? { ...t, approved: true } : t))
      );
      toast.success("Technician approved!");
    } catch {
      toast.error("Failed to verify technician");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this technician's user account?")) return;
    setActionId(id);
    try {
      const tech = technicians.find((t) => t._id === id);
      if (tech?.user && typeof tech.user === "object" && tech.user._id) {
        await adminService.deleteUser(tech.user._id);
      }
      setTechnicians((prev) => prev.filter((t) => t._id !== id));
      toast.success("Technician deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setActionId(null);
    }
  };

  const getName = (t: Technician) => {
    if (typeof t.user === "object" && t.user) {
      return t.user.name || t.name || "Unknown";
    }
    return t.name || "Unknown";
  };
  const getEmail = (t: Technician) => {
    if (typeof t.user === "object" && t.user) {
      return t.user.email || t.email || "";
    }
    return t.email || "";
  };

  const filtered = technicians.filter(
    (t) =>
      getName(t).toLowerCase().includes(search.toLowerCase()) ||
      getEmail(t).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate("/admin")}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-6 cursor-pointer border-none bg-transparent p-0"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2 mb-6">
            <Wrench size={24} />
            Manage Technicians
          </h1>
        </motion.div>

        <div className="relative mb-6">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search technicians..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {filtered.map((tech, i) => (
                <motion.div
                  key={tech._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-xl border border-gray-100 p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 bg-cyan-50 rounded-full flex items-center justify-center shrink-0">
                        <Wrench size={20} className="text-cyan-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-dark">{getName(tech)}</h3>
                        <p className="text-xs text-gray-400">{getEmail(tech)}</p>
                        {typeof tech.user === "object" && tech.user?.phone && (
                          <p className="text-xs text-gray-400">{tech.user.phone}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {/* Skills */}
                          <div className="flex flex-wrap gap-1">
                            {tech.skills.length > 0
                              ? tech.skills.map((s) => (
                                  <span
                                    key={s}
                                    className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-md"
                                  >
                                    {s}
                                  </span>
                                ))
                              : <span className="text-xs text-gray-400">No skills listed</span>
                            }
                          </div>
                        </div>
                        {/* Rating */}
                        <div className="flex items-center gap-1 mt-2">
                          <Star size={12} className="text-amber-400 fill-amber-400" />
                          <span className="text-xs text-gray-500">
                            {tech.ratingAvg.toFixed(1)} ({tech.ratingCount} reviews)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Approval Status */}
                      {tech.approved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-full">
                          <CheckCircle size={12} />
                          Approved
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleVerify(tech._id)}
                            disabled={actionId === tech._id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors cursor-pointer border-none disabled:opacity-50"
                          >
                            <CheckCircle size={12} />
                            Approve
                          </motion.button>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 text-xs font-medium rounded-full">
                            <XCircle size={12} />
                            Pending
                          </span>
                        </div>
                      )}

                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(tech._id)}
                        disabled={actionId === tech._id}
                        className="p-2 text-red-400 hover:bg-red-50 rounded-lg cursor-pointer border-none bg-transparent disabled:opacity-30 transition-colors"
                        title="Delete technician"
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium cursor-pointer border-none transition-colors ${
                      p === page ? "bg-primary text-white" : "bg-white text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
