import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
import { rateLimit } from "express-rate-limit";

import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import technicianRoutes from "./routes/technician.routes.js";
import jobRoutes from "./routes/job.routes.js";
import ratingRoutes from "./routes/rating.routes.js";

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});


app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(limiter);

export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "tech-dispatch-secret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 30 * 24 * 60 * 60, // 30 days
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
});

app.use(sessionMiddleware);

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/technicians", technicianRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/ratings", ratingRoutes);

app.get("/", (req, res) => {
  res.send("Tech Dispatch API running");
});

app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ success: false, message: err.message || "Internal server error" });
});

export default app;
