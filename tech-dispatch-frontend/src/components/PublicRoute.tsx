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
      // For technicians, we need to check if they're approved
      // Since we can't easily check approval status here without additional API calls,
      // redirect them to login where approval will be checked
      return <Navigate to="/login" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
