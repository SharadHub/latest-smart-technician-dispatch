import express from "express";
import {
  getAdminStats,
  getJobStats,
  getUsers,
  getUserById,
  getUserActivity,
  deleteUser,
  warnUser,
  removeWarning,
  getTechnicians,
  getTechnicianById,
  getTechnicianActivity,
  verifyTechnician,
  deleteTechnician,
} from "../controllers/admin.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(protect, isAdmin);

router.get("/stats", getAdminStats);
router.get("/job-stats", getJobStats);

router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.get("/users/:id/activity", getUserActivity);
router.delete("/users/:id", deleteUser);
router.post("/users/:id/warn", warnUser);
router.delete("/users/:id/warn/:warningId", removeWarning);

router.get("/technicians", getTechnicians);
router.get("/technicians/:id", getTechnicianById);
router.get("/technicians/:id/activity", getTechnicianActivity);
router.put("/technicians/:id/verify", verifyTechnician);
router.delete("/technicians/:id", deleteTechnician);
router.post("/technicians/:id/warn", (req, res, next) => {
  req.params.id = req.params.id; // find user id from technician
  next();
}, async (req, res, next) => {
  // Warn the underlying user account of a technician
  const Technician = (await import("../models/Technician.js")).default;
  const User = (await import("../models/User.js")).default;
  const { reason } = req.body;
  if (!reason?.trim()) return res.status(400).json({ success: false, message: "Warning reason is required" });
  try {
    const tech = await Technician.findById(req.params.id);
    if (!tech) return res.status(404).json({ success: false, message: "Technician not found" });
    const user = await User.findByIdAndUpdate(
      tech.user,
      { $push: { warnings: { reason: reason.trim(), issuedBy: req.user._id } } },
      { new: true }
    );
    res.status(200).json({ success: true, data: user });
  } catch (err) { next(err); }
});
router.delete("/technicians/:id/warn/:warningId", async (req, res, next) => {
  const Technician = (await import("../models/Technician.js")).default;
  const User = (await import("../models/User.js")).default;
  try {
    const tech = await Technician.findById(req.params.id);
    if (!tech) return res.status(404).json({ success: false, message: "Technician not found" });
    const user = await User.findByIdAndUpdate(
      tech.user,
      { $pull: { warnings: { _id: req.params.warningId } } },
      { new: true }
    );
    res.status(200).json({ success: true, data: user });
  } catch (err) { next(err); }
});

export default router;
