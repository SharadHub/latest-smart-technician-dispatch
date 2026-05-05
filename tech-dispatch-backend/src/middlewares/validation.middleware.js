import { body, validationResult } from "express-validator";
import { VALID_SKILLS } from "../config/serviceSkillMap.js";

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({ field: err.path, message: err.msg })),
    });
  }
  next();
};

export const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Please provide a valid email").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("phone").optional().trim().isMobilePhone().withMessage("Please provide a valid phone number"),
  body("role").optional().isIn(["user", "technician"]).withMessage("Role must be either 'user' or 'technician'"),
  body("skills")
    .optional()
    .isArray().withMessage("Skills must be an array")
    .custom((arr) => arr.every((s) => VALID_SKILLS.includes(s)))
    .withMessage(`Invalid skill(s). Allowed: ${VALID_SKILLS.join(", ")}`),
];

export const loginValidation = [
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Please provide a valid email").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];
