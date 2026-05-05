import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { LogOut, User, Wrench, Shield } from "lucide-react";

export default function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const dashboardLink = !user ? "/login" : user.role === "admin" ? "/admin" : user.role === "technician" ? "/technician" : "/dashboard";

  const RoleIcon = user?.role === "admin" ? Shield : user?.role === "technician" ? Wrench : User;

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <Wrench size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">TechDispatch</span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  to={dashboardLink}
                  className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors no-underline"
                >
                  Dashboard
                </Link>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <RoleIcon size={14} className="text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors no-underline">
                  Sign In
                </Link>
                <Link to="/register" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors no-underline">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
