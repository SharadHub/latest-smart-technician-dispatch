import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import PublicRoute from "../components/PublicRoute";

import Landing from "../pages/Landing";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import TechnicianPending from "../pages/auth/TechnicianPending";

import UserDashboard from "../pages/user/UserDashboard";
import BookService from "../pages/user/BookService";
import JobTracker from "../pages/user/JobTracker";
import RateJob from "../pages/user/RateJob";

import TechnicianDashboard from "../pages/technician/TechnicianDashboard";
import ActiveJob from "../pages/technician/ActiveJob";
import TechnicianReviews from "../pages/technician/TechnicianReviews";

import AdminDashboard from "../pages/admin/AdminDashboard";
import UsersList from "../pages/admin/UsersList";
import UserDetail from "../pages/admin/UserDetail";
import TechniciansList from "../pages/admin/TechniciansList";
import TechnicianDetail from "../pages/admin/TechnicianDetail";

const router = createBrowserRouter([
  { path: "/", element: <PublicRoute><Landing /></PublicRoute> },
  { path: "/login", element: <PublicRoute><Login /></PublicRoute> },
  { path: "/register", element: <PublicRoute><Register /></PublicRoute> },
  { path: "/technician-pending", element: <TechnicianPending /> },

  {
    path: "/dashboard",
    element: <ProtectedRoute roles={["user"]}><UserDashboard /></ProtectedRoute>,
  },
  {
    path: "/book",
    element: <ProtectedRoute roles={["user"]}><BookService /></ProtectedRoute>,
  },
  {
    path: "/track",
    element: <ProtectedRoute roles={["user"]}><JobTracker /></ProtectedRoute>,
  },
  {
    path: "/rate/:jobId",
    element: <ProtectedRoute roles={["user"]}><RateJob /></ProtectedRoute>,
  },

  {
    path: "/technician",
    element: <ProtectedRoute roles={["technician"]}><TechnicianDashboard /></ProtectedRoute>,
  },
  {
    path: "/technician/job",
    element: <ProtectedRoute roles={["technician"]}><ActiveJob /></ProtectedRoute>,
  },
  {
    path: "/technician/reviews",
    element: <ProtectedRoute roles={["technician"]}><TechnicianReviews /></ProtectedRoute>,
  },

  {
    path: "/admin",
    element: <ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>,
  },
  {
    path: "/admin/users",
    element: <ProtectedRoute roles={["admin"]}><UsersList /></ProtectedRoute>,
  },
  {
    path: "/admin/users/:id",
    element: <ProtectedRoute roles={["admin"]}><UserDetail /></ProtectedRoute>,
  },
  {
    path: "/admin/technicians",
    element: <ProtectedRoute roles={["admin"]}><TechniciansList /></ProtectedRoute>,
  },
  {
    path: "/admin/technicians/:id",
    element: <ProtectedRoute roles={["admin"]}><TechnicianDetail /></ProtectedRoute>,
  },
]);

export default router;
