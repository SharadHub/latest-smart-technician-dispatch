import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "../../store/authStore";
import Navbar from "../../components/layout/Navbar";
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  Loader2,
  Trash2,
} from "lucide-react";

export default function UserProfile() {
  const { user, updateUser, logout } = useAuthStore();
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, email: user.email, phone: user.phone || "" });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put("/auth/updatedetails", form);
      updateUser(res.data.data);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await api.put("/auth/updatepassword", passwordForm);
      localStorage.setItem("token", res.data.token);
      toast.success("Password changed!");
      setPasswordForm({ currentPassword: "", newPassword: "" });
    } catch {
      toast.error("Current password is incorrect");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete("/auth/me");
      toast.success("Account deleted");
      logout();
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-dark">My Profile</h1>
          <p className="text-gray-500 mt-1">Manage your account information</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 bg-white rounded-xl border border-gray-100 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-primary to-blue-700 px-6 py-8">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <User size={32} className="text-white" />
            </div>
            <h2 className="mt-3 text-xl font-bold text-white">{user?.name}</h2>
            <p className="text-blue-100 text-sm">{user?.email}</p>
          </div>

          <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone
              </label>
              <div className="relative">
                <Phone
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors cursor-pointer border-none text-sm disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Save Changes
            </motion.button>
          </form>
        </motion.div>

        {/* Change Password */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-white rounded-xl border border-gray-100 p-6"
        >
          <h3 className="text-lg font-semibold text-dark mb-4 flex items-center gap-2">
            <Lock size={18} />
            Change Password
          </h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <input
              type="password"
              placeholder="Current password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm((p) => ({
                  ...p,
                  currentPassword: e.target.value,
                }))
              }
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <input
              type="password"
              placeholder="New password (min 6 chars)"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm((p) => ({
                  ...p,
                  newPassword: e.target.value,
                }))
              }
              required
              minLength={6}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={savingPassword}
              className="px-4 py-2.5 bg-dark text-white font-medium rounded-lg hover:bg-darker transition-colors cursor-pointer border-none text-sm disabled:opacity-50"
            >
              {savingPassword ? "Changing..." : "Update Password"}
            </motion.button>
          </form>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-white rounded-xl border border-red-100 p-6"
        >
          <h3 className="text-lg font-semibold text-red-600 mb-2 flex items-center gap-2">
            <Trash2 size={18} />
            Danger Zone
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Permanently delete your account and all associated data.
          </p>
          {showDeleteConfirm ? (
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 cursor-pointer border-none text-sm disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </motion.button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-500 bg-gray-100 rounded-lg cursor-pointer border-none text-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 text-red-500 bg-red-50 hover:bg-red-100 font-medium rounded-lg cursor-pointer border-none text-sm"
            >
              Delete Account
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
