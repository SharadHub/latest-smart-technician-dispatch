import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: "Technician", default: null },

  serviceType: {
    type: String,
    enum: ["plumbing", "electrical", "hvac", "appliance_repair", "carpentry", "painting", "cleaning", "general_maintenance"],
    required: true,
  },
  description: { type: String, required: true, maxlength: 500 },

  clientLocation: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  clientAddress: { type: String },

  status: {
    type: String,
    enum: ["searching", "assigned", "en_route", "in_progress", "completed", "cancelled", "expired"],
    default: "searching",
  },

  dispatchQueue: [{ type: mongoose.Schema.Types.ObjectId, ref: "Technician" }],
  currentDispatchIndex: { type: Number, default: 0 },
  notifiedTechnicians: [{ type: mongoose.Schema.Types.ObjectId, ref: "Technician" }],

  expiresAt: { type: Date, required: true },
  acceptedAt: { type: Date },
  completedAt: { type: Date },
  rating: { type: mongoose.Schema.Types.ObjectId, ref: "Rating", default: null },
}, { timestamps: true });

jobSchema.index({ clientLocation: "2dsphere" });
jobSchema.index({ status: 1, expiresAt: 1 });
jobSchema.index({ user: 1, status: 1 });
jobSchema.index({ technician: 1, status: 1 });

export default mongoose.model("Job", jobSchema);
