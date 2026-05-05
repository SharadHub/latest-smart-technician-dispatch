import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { LayoutDashboard, Users, Wrench, LogOut } from "lucide-react";
import type { ReactNode } from "react";

const navLinks = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/technicians", label: "Technicians", icon: Wrench },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <div className="flex min-h-screen">
      {/* Black Sidebar */}
      <aside className="w-60 bg-[#111111] text-white flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Wrench size={16} className="text-[#111111]" />
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-none">TechDispatch</div>
              <div className="text-xs text-white/40 mt-0.5">Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors no-underline ${
                  isActive
                    ? "bg-white text-[#111111]"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* White Content */}
      <main className="flex-1 bg-white overflow-auto">
        {children}
      </main>
    </div>
  );
}
