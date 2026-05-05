import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminService } from "../../services";
import AdminLayout from "../../components/admin/AdminLayout";
import { Trash2, Search, ChevronLeft, ChevronRight, AlertTriangle, X } from "lucide-react";
import toast from "react-hot-toast";
import type { User } from "../../types";

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
          <h3 className="text-base font-semibold text-gray-900">Issue Warning — {user.name}</h3>
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

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [warnTarget, setWarnTarget] = useState<User | null>(null);

  const fetchUsers = async (p = page, q = search) => {
    setLoading(true);
    try {
      const res = await adminService.getUsers(p, 10, q);
      setUsers(res.data);
      setPages(res.pages);
      setTotal(res.total);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(1, search); setPage(1); }, [search]);
  useEffect(() => { fetchUsers(page, search); }, [page]);

  const handleDelete = async (id: string, role: string) => {
    if (role === "admin") return;
    if (!confirm("Delete this user? This action cannot be undone.")) return;
    try {
      await adminService.deleteUser(id);
      toast.success("User deleted");
      fetchUsers(page, search);
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: "bg-purple-50 text-purple-700",
      technician: "bg-blue-50 text-blue-700",
      user: "bg-gray-100 text-gray-600",
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[role] || styles.user}`}>
        {role}
      </span>
    );
  };

  return (
    <AdminLayout>
      {warnTarget && (
        <WarnModal
          user={warnTarget}
          onClose={() => setWarnTarget(null)}
          onSuccess={(updated) => setUsers((prev) => prev.map((u) => u._id === updated._id ? updated : u))}
        />
      )}
      <div className="px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            <p className="text-sm text-gray-500 mt-0.5">{total} total accounts</p>
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

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Warnings</th>
                <th className="px-6 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">No users found</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/admin/users/${user._id}`} className="flex items-center gap-3 no-underline group">
                        <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">{roleBadge(user.role)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.phone || "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4">
                      {(user.warnings?.length ?? 0) > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">
                          <AlertTriangle size={11} />
                          {user.warnings!.length}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setWarnTarget(user)}
                          disabled={user.role === "admin"}
                          className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors bg-transparent border-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Issue warning"
                        >
                          <AlertTriangle size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id, user.role)}
                          disabled={user.role === "admin"}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors bg-transparent border-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title={user.role === "admin" ? "Cannot delete admin" : "Delete user"}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between mt-4">
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
