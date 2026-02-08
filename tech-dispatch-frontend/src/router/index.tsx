import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

// Public pages
import Landing from "../pages/Landing";
import Services from "../pages/Services";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

// User pages
import UserDashboard from "../pages/user/UserDashboard";
import CreateBooking from "../pages/user/CreateBooking";
import MyBookings from "../pages/user/MyBookings";
import UserProfile from "../pages/user/Profile";

// Technician pages
import TechnicianDashboard from "../pages/technician/TechnicianDashboard";
import AssignedJobs from "../pages/technician/AssignedJobs";
import TechnicianRatings from "../pages/technician/TechnicianRatings";
import TechnicianProfile from "../pages/technician/TechnicianProfile";

// Admin pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import UsersList from "../pages/admin/UsersList";
import TechniciansList from "../pages/admin/TechniciansList";
import JobReports from "../pages/admin/JobReports";

const router = createBrowserRouter([
  // Public
  { path: "/", element: <Landing /> },
  { path: "/services", element: <Services /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },

  // User (role: user)
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute roles={["user"]}>
        <UserDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/book",
    element: (
      <ProtectedRoute roles={["user"]}>
        <CreateBooking />
      </ProtectedRoute>
    ),
  },
  {
    path: "/my-bookings",
    element: (
      <ProtectedRoute roles={["user"]}>
        <MyBookings />
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute roles={["user"]}>
        <UserProfile />
      </ProtectedRoute>
    ),
  },

  // Technician (role: technician)
  {
    path: "/technician",
    element: (
      <ProtectedRoute roles={["technician"]}>
        <TechnicianDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/technician/jobs",
    element: (
      <ProtectedRoute roles={["technician"]}>
        <AssignedJobs />
      </ProtectedRoute>
    ),
  },
  {
    path: "/technician/ratings",
    element: (
      <ProtectedRoute roles={["technician"]}>
        <TechnicianRatings />
      </ProtectedRoute>
    ),
  },
  {
    path: "/technician/profile",
    element: (
      <ProtectedRoute roles={["technician"]}>
        <TechnicianProfile />
      </ProtectedRoute>
    ),
  },

  // Admin (role: admin)
  {
    path: "/admin",
    element: (
      <ProtectedRoute roles={["admin"]}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/users",
    element: (
      <ProtectedRoute roles={["admin"]}>
        <UsersList />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/technicians",
    element: (
      <ProtectedRoute roles={["admin"]}>
        <TechniciansList />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/reports",
    element: (
      <ProtectedRoute roles={["admin"]}>
        <JobReports />
      </ProtectedRoute>
    ),
  },
]);

export default router;
