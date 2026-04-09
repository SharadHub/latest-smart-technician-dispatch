import express from "express";
import {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  deleteMe,
  updateLocation
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import {
  registerValidation,
  loginValidation,
  updateDetailsValidation,
  updatePasswordValidation,
  handleValidationErrors
} from "../middlewares/validation.middleware.js";

const router = express.Router();

router.post("/register", registerValidation, handleValidationErrors, register);
router.post("/login", loginValidation, handleValidationErrors, login);
router.get("/me", protect, getMe);
router.delete("/me", protect, deleteMe);
router.put("/updatedetails", protect, updateDetailsValidation, handleValidationErrors, updateDetails);
router.put("/updatepassword", protect, updatePasswordValidation, handleValidationErrors, updatePassword);
router.put("/location", protect, updateLocation);

export default router;
