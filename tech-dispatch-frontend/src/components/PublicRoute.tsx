import { Navigate } from "react-router-dom";
import { useAuthStore, type AuthState } from "../store/authStore";

interface PublicRouteProps {
  children: React.ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const user = useAuthStore((s: AuthState) => s.user);

  // If user is logged in, redirect to their dashboard
  if (user) {
    if (user.role === "admin") {
      return <Navigate to="/admin" replace />;
    } else if (user.role === "technician") {
      return <Navigate to="/technician" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
