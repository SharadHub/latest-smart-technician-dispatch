import express from "express";
import { getProfile } from "../controllers/technician.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { isTechnician } from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(protect, isTechnician);

router.get("/profile", getProfile);

export default router;
