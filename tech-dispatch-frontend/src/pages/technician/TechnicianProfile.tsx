import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "../../store/authStore";
import Navbar from "../../components/layout/Navbar";
import { technicianService } from "../../services";
import toast from "react-hot-toast";
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  Loader2,
  ArrowLeft,
  Wrench,
  MapPin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SERVICE_TYPES } from "../../config/services";

export default function TechnicianProfile() {
  const navigate = useNavigate();
  const { user, updateUser, changePassword } = useAuthStore();

  const [userForm, setUserForm] = useState({ name: "", email: "", phone: "" });
  const [skills, setSkills] = useState<string[]>([]);
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSkills, setSavingSkills] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);

  useEffect(() => {
    if (user) {
      setUserForm({ name: user.name, email: user.email, phone: user.phone || "" });
    }
    const fetchProfile = async () => {
      try {
        const tech = await technicianService.getProfile();
        if (tech.skills) setSkills(tech.skills);
        if (tech.location?.coordinates) setCoords(tech.location.coordinates);
      } catch {
        // profile may not exist yet
      }
    };
    fetchProfile();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateUser(userForm);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateSkills = async () => {
    setSavingSkills(true);
    try {
      await technicianService.updateProfile({ skills });
      toast.success("Skills updated!");
    } catch {
      toast.error("Failed to update skills");
    } finally {
      setSavingSkills(false);
    }
  };

  const toggleSkill = (key: string) => {
    setSkills((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  const handleUpdateLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    setSavingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const newCoords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        try {
          await technicianService.updateLocation({ coordinates: newCoords });
          setCoords(newCoords);
          toast.success("Location updated!");
        } catch {
          toast.error("Failed to update location");
        } finally {
          setSavingLocation(false);
        }
      },
      () => {
        toast.error("Failed to get location");
        setSavingLocation(false);
      }
    );
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success("Password changed!");
      setPasswordForm({ currentPassword: "", newPassword: "" });
    } catch {
      toast.error("Current password is incorrect");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate("/technician")}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-6 cursor-pointer border-none bg-transparent p-0"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-dark">Technician Profile</h1>
          <p className="text-gray-500 mt-1">Manage your account and skills</p>
        </motion.div>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 bg-white rounded-xl border border-gray-100 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-secondary to-cyan-700 px-6 py-8">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Wrench size={32} className="text-white" />
            </div>
            <h2 className="mt-3 text-xl font-bold text-white">{user?.name}</h2>
            <p className="text-cyan-100 text-sm">{user?.email}</p>
          </div>

          <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) => setUserForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors cursor-pointer border-none text-sm disabled:opacity-50"
            >
              {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Changes
            </motion.button>
          </form>
        </motion.div>

        {/* Skills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-white rounded-xl border border-gray-100 p-6"
        >
          <h3 className="text-lg font-semibold text-dark mb-4 flex items-center gap-2">
            <Wrench size={18} />
            My Skills
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {SERVICE_TYPES.map((s) => (
              <motion.button
                key={s.key}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleSkill(s.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer border transition-all ${
                  skills.includes(s.key)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                }`}
              >
                {s.label}
              </motion.button>
            ))}
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleUpdateSkills}
            disabled={savingSkills}
            className="px-4 py-2.5 bg-secondary text-white font-medium rounded-lg hover:bg-secondary-dark transition-colors cursor-pointer border-none text-sm disabled:opacity-50"
          >
            {savingSkills ? "Saving..." : "Update Skills"}
          </motion.button>
        </motion.div>

        {/* Location */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-6 bg-white rounded-xl border border-gray-100 p-6"
        >
          <h3 className="text-lg font-semibold text-dark mb-4 flex items-center gap-2">
            <MapPin size={18} />
            My Location
          </h3>
          {coords && (
            <p className="text-sm text-gray-500 mb-3">
              Current: {coords[1].toFixed(4)}, {coords[0].toFixed(4)}
            </p>
          )}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleUpdateLocation}
            disabled={savingLocation}
            className="px-4 py-2.5 bg-dark text-white font-medium rounded-lg hover:bg-darker transition-colors cursor-pointer border-none text-sm disabled:opacity-50"
          >
            {savingLocation ? "Updating..." : "Update Location"}
          </motion.button>
        </motion.div>

        {/* Change Password */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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
              onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <input
              type="password"
              placeholder="New password (min 6 chars)"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
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
      </div>
    </div>
  );
}
