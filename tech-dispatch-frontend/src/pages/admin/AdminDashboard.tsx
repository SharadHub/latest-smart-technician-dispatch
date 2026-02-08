import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../../components/layout/Navbar";
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  Users,
  Wrench,
  ClipboardList,
  TrendingUp,
  Loader2,
  ArrowRight,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  BarChart3,
  Shield,
} from "lucide-react";

interface Stats {
  users: number;
  technicians: number;
  bookings: {
    total: number;
    byStatus: Record<string, number>;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/admin/stats");
        setStats(res.data.data);
      } catch {
        toast.error("Failed to load stats");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Users",
      value: stats?.users || 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Technicians",
      value: stats?.technicians || 0,
      icon: Wrench,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
    },
    {
      label: "Total Bookings",
      value: stats?.bookings.total || 0,
      icon: ClipboardList,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Completed",
      value: stats?.bookings.byStatus?.completed || 0,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  const statusBreakdown = [
    { key: "requested", label: "Requested", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { key: "accepted", label: "Accepted", icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-50" },
    { key: "completed", label: "Completed", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { key: "failed", label: "Failed", icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
    { key: "cancelled", label: "Cancelled", icon: XCircle, color: "text-gray-600", bg: "bg-gray-50" },
    { key: "expired", label: "Expired", icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm">System overview and management</p>
          </div>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-xl border border-gray-100 p-5"
            >
              <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center mb-3`}>
                <card.icon size={20} className={card.color} />
              </div>
              <div className="text-2xl font-bold text-dark">{card.value}</div>
              <div className="text-sm text-gray-500">{card.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Status Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-100 p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-dark mb-4 flex items-center gap-2">
            <BarChart3 size={18} />
            Bookings by Status
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {statusBreakdown.map((s) => (
              <div key={s.key} className={`${s.bg} rounded-xl p-4 text-center`}>
                <s.icon size={20} className={`${s.color} mx-auto mb-2`} />
                <div className="text-xl font-bold text-dark">
                  {stats?.bookings.byStatus?.[s.key] || 0}
                </div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/admin/users" className="no-underline">
            <motion.div
              whileHover={{ y: -2 }}
              className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-blue-600" />
                </div>
                <ArrowRight size={16} className="text-gray-300 group-hover:text-primary transition-colors" />
              </div>
              <h3 className="mt-3 font-semibold text-dark">Manage Users</h3>
              <p className="text-xs text-gray-400 mt-1">View, block, or delete user accounts</p>
            </motion.div>
          </Link>
          <Link to="/admin/technicians" className="no-underline">
            <motion.div
              whileHover={{ y: -2 }}
              className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center">
                  <Wrench size={20} className="text-cyan-600" />
                </div>
                <ArrowRight size={16} className="text-gray-300 group-hover:text-primary transition-colors" />
              </div>
              <h3 className="mt-3 font-semibold text-dark">Manage Technicians</h3>
              <p className="text-xs text-gray-400 mt-1">Approve or reject registrations</p>
            </motion.div>
          </Link>
          <Link to="/admin/reports" className="no-underline">
            <motion.div
              whileHover={{ y: -2 }}
              className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <BarChart3 size={20} className="text-purple-600" />
                </div>
                <ArrowRight size={16} className="text-gray-300 group-hover:text-primary transition-colors" />
              </div>
              <h3 className="mt-3 font-semibold text-dark">Job Reports</h3>
              <p className="text-xs text-gray-400 mt-1">Analyze job requests over time</p>
            </motion.div>
          </Link>
        </div>
      </div>
    </div>
  );
}
