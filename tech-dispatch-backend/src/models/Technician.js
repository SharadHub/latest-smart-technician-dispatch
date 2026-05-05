import mongoose from "mongoose";
import { VALID_SKILLS } from "../config/serviceSkillMap.js";

const technicianSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  name: String,
  email: { type: String, unique: true },
  phone: String,
  skills: {
    type: [String],
    validate: {
      validator: (arr) => arr.every((s) => VALID_SKILLS.includes(s)),
      message: "One or more skills are invalid.",
    },
  },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  approved: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: false },
  socketId: { type: String, default: null },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
  },
  currentJob: { type: mongoose.Schema.Types.ObjectId, ref: "Job", default: null },
}, { timestamps: true });

technicianSchema.index({ location: "2dsphere" });

export default mongoose.model("Technician", technicianSchema);
