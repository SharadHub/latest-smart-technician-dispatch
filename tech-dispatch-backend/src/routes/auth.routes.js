import express from "express";
import { rateLimit } from "express-rate-limit";
import { register, login, logout, getMe } from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { registerValidation, loginValidation, handleValidationErrors } from "../middlewares/validation.middleware.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many authentication attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit only the credential-submission routes, not session reads/logout
router.post("/register", authLimiter, registerValidation, handleValidationErrors, register);
router.post("/login", authLimiter, loginValidation, handleValidationErrors, login);
router.post("/logout", logout);
router.get("/me", protect, getMe);

export default router;
