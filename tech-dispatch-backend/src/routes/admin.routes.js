import express from "express";
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getTechnicians,
  verifyTechnician,
  getAdminStats
} from "../controllers/admin.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/role.middleware.js";

const router = express.Router();

// Apply protect and isAdmin middleware to all routes
router.use(protect, isAdmin);

router.get("/stats", getAdminStats);

router.route("/users")
  .get(getUsers);

router.route("/users/:id")
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

router.get("/technicians", getTechnicians);
router.put("/technicians/:id/verify", verifyTechnician);

export default router;
