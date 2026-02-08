import express from "express";
import cors from "cors";

// Route imports
import authRoutes from "./routes/auth.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import technicianRoutes from "./routes/technician.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/technicians", technicianRoutes);

app.get("/", (req, res) => {
  res.send("Tech Dispatch API running");
});

export default app;
