import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminService } from "../../services";
import AdminLayout from "../../components/admin/AdminLayout";
import { Users, Wrench, Clock, CheckCircle } from "lucide-react";
import type { AdminStats } from "../../types";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

type Period = "daily" | "weekly" | "monthly" | "yearly";
type JobStatPoint = { label: string; completed: number; failed: number };
type JobStats = Record<Period, JobStatPoint[]>;

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [jobStats, setJobStats] = useState<JobStats | null>(null);
  const [period, setPeriod] = useState<Period>("daily");
  const today = new Date().toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });

  useEffect(() => {
    adminService.getStats().then((res) => setStats(res.data)).catch(() => {});
    adminService.getJobStats().then((res) => setJobStats(res.data)).catch(() => {});
  }, []);

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers ?? "—", icon: Users, bg: "bg-blue-50", color: "text-blue-600" },
    { label: "Total Technicians", value: stats?.totalTechnicians ?? "—", icon: Wrench, bg: "bg-green-50", color: "text-green-600" },
    { label: "Pending Approval", value: stats?.pendingTechnicians ?? "—", icon: Clock, bg: "bg-amber-50", color: "text-amber-600" },
    { label: "Approved Technicians", value: stats?.approvedTechnicians ?? "—", icon: CheckCircle, bg: "bg-purple-50", color: "text-purple-600" },
  ];

  const periodLabels: Record<Period, string> = {
    daily: "Last 7 Days",
    weekly: "Last 4 Weeks",
    monthly: "Last 12 Months",
    yearly: "Last 4 Years",
  };

  const chartData = jobStats?.[period] ?? [];

  return (
    <AdminLayout>
      <div className="px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Users size={18} className="text-gray-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Analytics</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{today}</span>
            <Link to="/admin/users" className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors no-underline">
              Manage Users
            </Link>
            <Link to="/admin/technicians" className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors no-underline">
              Manage Technicians
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map(({ label, value, icon: Icon, bg, color }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                <Icon size={22} className={color} />
              </div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            </div>
          ))}
        </div>

        {/* Job Stats Chart */}
        <div className="mt-8 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Job Activity</h2>
              <p className="text-sm text-gray-500 mt-0.5">Completed vs failed/expired jobs</p>
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {(["daily", "weekly", "monthly", "yearly"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border-none cursor-pointer capitalize ${
                    period === p ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 bg-transparent hover:text-gray-700"
                  }`}
                >
                  {p === "daily" ? "7D" : p === "weekly" ? "4W" : p === "monthly" ? "12M" : "4Y"}
                </button>
              ))}
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-gray-400">
              Loading chart data...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ border: "1px solid #f0f0f0", borderRadius: "12px", fontSize: "12px" }}
                  cursor={{ fill: "#f9fafb" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                <Bar dataKey="completed" name="Completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="failed" name="Failed / Expired" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}

          <p className="text-xs text-gray-400 mt-2 text-center">{periodLabels[period]}</p>
        </div>

        {/* Quick Links */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Link to="/admin/users" className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow no-underline group">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
              <Users size={22} className="text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Manage Users</h3>
            <p className="text-sm text-gray-500 mt-1">View, search, warn and remove user accounts</p>
          </Link>

          <Link to="/admin/technicians" className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow no-underline group">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
              <Wrench size={22} className="text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Manage Technicians</h3>
            <p className="text-sm text-gray-500 mt-1">Approve, warn, review and manage technician accounts</p>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
