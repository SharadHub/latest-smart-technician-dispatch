import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function PublicRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);

  if (user) {
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "technician") return <Navigate to="/technician" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
