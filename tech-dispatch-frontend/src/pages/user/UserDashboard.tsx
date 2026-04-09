import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../../store/authStore";
import { SERVICE_TYPES } from "../../config/services";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import {
  CalendarDays,
  ClipboardList,
  User,
  ArrowRight,
} from "lucide-react";

export default function UserDashboard() {
  const user = useAuthStore((s) => s.user);

  const quickActions = [
    {
      icon: ClipboardList,
      label: "Book a Service",
      desc: "Find a technician for your needs",
      to: "/book",
      color: "bg-primary",
    },
    {
      icon: CalendarDays,
      label: "My Bookings",
      desc: "Track your service requests",
      to: "/my-bookings",
      color: "bg-secondary",
    },
    {
      icon: User,
      label: "My Profile",
      desc: "Manage your account settings",
      to: "/profile",
      color: "bg-accent",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-dark">
            Welcome back, {user?.name} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            What service do you need today?
          </p>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {quickActions.map((action, i) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link to={action.to} className="no-underline">
                <div className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg transition-all group cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-11 h-11 ${action.color} rounded-lg flex items-center justify-center`}
                    >
                      <action.icon size={22} className="text-white" />
                    </div>
                    <ArrowRight
                      size={18}
                      className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all"
                    />
                  </div>
                  <h3 className="mt-4 font-semibold text-dark">
                    {action.label}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{action.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Browse Services */}
        <div>
          <h2 className="text-lg font-semibold text-dark mb-4">
            Browse Services
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SERVICE_TYPES.map((service, i) => (
              <motion.div
                key={service.key}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                <Link
                  to={`/book?service=${service.key}`}
                  className="no-underline"
                >
                  <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md hover:border-transparent transition-all group text-center">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: service.bg }}
                    >
                      <service.icon
                        size={24}
                        style={{ color: service.color }}
                      />
                    </div>
                    <h3 className="text-sm font-medium text-dark">
                      {service.label}
                    </h3>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
