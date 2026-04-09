import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../../components/layout/Navbar";
import { bookingService } from "../../services";
import toast from "react-hot-toast";
import {
  BarChart3,
  Loader2,
  ArrowLeft,
  Calendar,
  Filter,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getServiceByKey, SERVICE_TYPES } from "../../config/services";

interface BookingItem {
  _id: string;
  serviceType: string;
  status: string;
  createdAt: string;
  technicianId?: { name?: string } | string | null;
}

type Period = "daily" | "weekly" | "monthly" | "yearly";

export default function JobReports() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("monthly");
  const [serviceFilter, setServiceFilter] = useState("");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await bookingService.getBookings();
        setBookings(res);
      } catch {
        toast.error("Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Filter by service type
  const filtered = serviceFilter
    ? bookings.filter((b) => b.serviceType === serviceFilter)
    : bookings;

  // Group by time period
  const groupByPeriod = (items: BookingItem[], p: Period) => {
    const groups: Record<string, number> = {};
    items.forEach((b) => {
      const d = new Date(b.createdAt);
      let key = "";
      switch (p) {
        case "daily":
          key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          break;
        case "weekly": {
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() - d.getDay());
          key = `Week of ${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
          break;
        }
        case "monthly":
          key = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
          break;
        case "yearly":
          key = d.getFullYear().toString();
          break;
      }
      groups[key] = (groups[key] || 0) + 1;
    });
    return Object.entries(groups).reverse();
  };

  // Group by service type
  const groupByService = (items: BookingItem[]) => {
    const groups: Record<string, number> = {};
    items.forEach((b) => {
      groups[b.serviceType] = (groups[b.serviceType] || 0) + 1;
    });
    return Object.entries(groups).sort((a, b) => b[1] - a[1]);
  };

  const periodGroups = groupByPeriod(filtered, period);
  const serviceGroups = groupByService(filtered);
  const maxCount = Math.max(...periodGroups.map(([, c]) => c), 1);
  const maxServiceCount = Math.max(...serviceGroups.map(([, c]) => c), 1);

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
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2 mb-2">
            <BarChart3 size={24} />
            Job Reports
          </h1>
          <p className="text-gray-500">
            Analyze job requests by time period and service type
          </p>
        </motion.div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
            <Calendar size={16} className="text-gray-400 ml-2" />
            {(["daily", "weekly", "monthly", "yearly"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer border-none transition-all capitalize ${
                  period === p
                    ? "bg-primary text-white"
                    : "text-gray-500 bg-transparent hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
            <Filter size={16} className="text-gray-400 ml-2" />
            <button
              onClick={() => setServiceFilter("")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer border-none transition-all ${
                serviceFilter === ""
                  ? "bg-primary text-white"
                  : "text-gray-500 bg-transparent hover:bg-gray-50"
              }`}
            >
              All
            </button>
            {SERVICE_TYPES.map((s) => (
              <button
                key={s.key}
                onClick={() => setServiceFilter(s.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer border-none transition-all ${
                  serviceFilter === s.key
                    ? "bg-primary text-white"
                    : "text-gray-500 bg-transparent hover:bg-gray-50"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={18} className="text-primary" />
                  <span className="text-sm font-medium text-gray-500">
                    Total ({serviceFilter ? getServiceByKey(serviceFilter)?.label : "All"})
                  </span>
                </div>
                <div className="text-3xl font-bold text-dark">{filtered.length}</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={18} className="text-secondary" />
                  <span className="text-sm font-medium text-gray-500">Periods</span>
                </div>
                <div className="text-3xl font-bold text-dark">{periodGroups.length}</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 size={18} className="text-purple-600" />
                  <span className="text-sm font-medium text-gray-500">Service Types</span>
                </div>
                <div className="text-3xl font-bold text-dark">{serviceGroups.length}</div>
              </div>
            </div>

            {/* Bar Chart - By Period */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 bg-white rounded-xl border border-gray-100 p-6"
            >
              <h3 className="text-lg font-semibold text-dark mb-4">
                Jobs by {period.charAt(0).toUpperCase() + period.slice(1)} Period
              </h3>
              {periodGroups.length === 0 ? (
                <p className="text-gray-400 text-sm py-8 text-center">No data</p>
              ) : (
                <div className="space-y-3">
                  {periodGroups.map(([label, count]) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 w-40 shrink-0 truncate">
                        {label}
                      </span>
                      <div className="flex-1 h-8 bg-gray-50 rounded-lg overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / maxCount) * 100}%` }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                          className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-lg flex items-center justify-end pr-2"
                        >
                          <span className="text-xs font-semibold text-white">{count}</span>
                        </motion.div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* By Service Type */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 bg-white rounded-xl border border-gray-100 p-6"
            >
              <h3 className="text-lg font-semibold text-dark mb-4">
                Jobs by Service Type
              </h3>
              {serviceGroups.length === 0 ? (
                <p className="text-gray-400 text-sm py-8 text-center">No data</p>
              ) : (
                <div className="space-y-3">
                  {serviceGroups.map(([key, count]) => {
                    const service = getServiceByKey(key);
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <div className="flex items-center gap-2 w-40 shrink-0">
                          {service && (
                            <div
                              className="w-6 h-6 rounded flex items-center justify-center"
                              style={{ backgroundColor: service.bg }}
                            >
                              <service.icon size={14} style={{ color: service.color }} />
                            </div>
                          )}
                          <span className="text-sm text-gray-600 truncate">
                            {service?.label || key}
                          </span>
                        </div>
                        <div className="flex-1 h-8 bg-gray-50 rounded-lg overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(count / maxServiceCount) * 100}%` }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            className="h-full rounded-lg flex items-center justify-end pr-2"
                            style={{
                              backgroundColor: service?.color || "#6366f1",
                              opacity: 0.8,
                            }}
                          >
                            <span className="text-xs font-semibold text-white">{count}</span>
                          </motion.div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
