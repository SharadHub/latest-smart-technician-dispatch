import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../../components/layout/Navbar";
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  Users,
  Loader2,
  ArrowLeft,
  Trash2,
  Search,
  Shield,
  Wrench,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UserItem {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
}

export default function UsersList() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = async (p: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users?page=${p}&limit=10`);
      setUsers(res.data.data);
      setTotalPages(res.data.pages);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      toast.success("User deleted");
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  const getRoleIcon = (role: string) => {
    if (role === "admin") return <Shield size={14} className="text-purple-500" />;
    if (role === "technician") return <Wrench size={14} className="text-cyan-500" />;
    return <User size={14} className="text-blue-500" />;
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: "bg-purple-50 text-purple-600",
      technician: "bg-cyan-50 text-cyan-600",
      user: "bg-blue-50 text-blue-600",
    };
    return styles[role] || styles.user;
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
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

        <div className="flex items-center justify-between mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
              <Users size={24} />
              All Users
            </h1>
          </motion.div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              {getRoleIcon(u.role)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-dark">{u.name}</p>
                              <p className="text-xs text-gray-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(u.role)}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500">{u.phone || "—"}</td>
                        <td className="px-5 py-4 text-sm text-gray-400">
                          {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(u._id)}
                            disabled={deletingId === u._id || u.role === "admin"}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg cursor-pointer border-none bg-transparent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title={u.role === "admin" ? "Cannot delete admin" : "Delete user"}
                          >
                            <Trash2 size={16} />
                          </motion.button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium cursor-pointer border-none transition-colors ${
                      p === page
                        ? "bg-primary text-white"
                        : "bg-white text-gray-500 hover:bg-gray-100"
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
