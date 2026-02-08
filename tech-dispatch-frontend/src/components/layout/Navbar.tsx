import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { motion } from "framer-motion";
import { LogOut, Menu, X, User, Wrench, Shield, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";

export default function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate("/");
  };

  const getDashboardLink = () => {
    if (!user) return "/login";
    if (user.role === "admin") return "/admin";
    if (user.role === "technician") return "/technician";
    return "/dashboard";
  };

  const getRoleIcon = () => {
    if (!user) return null;
    if (user.role === "admin") return <Shield size={16} />;
    if (user.role === "technician") return <Wrench size={16} />;
    return <User size={16} />;
  };

  return (
    <>
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Wrench size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-dark">
              Tech<span className="text-primary">Dispatch</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-medium text-gray-600 hover:text-primary transition-colors no-underline"
            >
              Home
            </Link>
            <Link
              to="/services"
              className="text-sm font-medium text-gray-600 hover:text-primary transition-colors no-underline"
            >
              Services
            </Link>

            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  to={getDashboardLink()}
                  className="text-sm font-medium text-gray-600 hover:text-primary transition-colors no-underline"
                >
                  Dashboard
                </Link>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {getRoleIcon()}
                  </div>
                  <span className="text-sm font-medium text-dark">
                    {user.name}
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowLogoutModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                >
                  <LogOut size={16} />
                  Logout
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-600 hover:text-primary transition-colors no-underline"
                >
                  Sign In
                </Link>
                <Link to="/register">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors cursor-pointer border-none"
                  >
                    Get Started
                  </motion.button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-primary cursor-pointer border-none bg-transparent"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden py-4 border-t border-gray-100 space-y-2"
          >
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg no-underline"
            >
              Home
            </Link>
            <Link
              to="/services"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg no-underline"
            >
              Services
            </Link>
            {user ? (
              <>
                <Link
                  to={getDashboardLink()}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg no-underline"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    setShowLogoutModal(true);
                    setMobileOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg cursor-pointer border-none bg-transparent"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg no-underline"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg no-underline"
                >
                  Get Started
                </Link>
              </>
            )}
          </motion.div>
        )}
      </div>
    </nav>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4"
            onClick={() => setShowLogoutModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center"
            >
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-dark">Logout?</h3>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to log out of your account?
              </p>
              <div className="mt-6 flex items-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-lg hover:bg-gray-200 transition-colors cursor-pointer border-none text-sm"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="flex-1 py-2.5 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors cursor-pointer border-none text-sm"
                >
                  Yes, Logout
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
