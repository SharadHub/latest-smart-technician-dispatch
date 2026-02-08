import mongoose from "mongoose";

const technicianSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  name: String,
  email: { type: String, unique: true },
  skills: [String],
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    }
  },
  status: { type: String, enum: ["active", "busy", "inactive"], default: "active" },
  approved: { type: Boolean, default: false },
  ratingAvg: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 }
}, { timestamps: true });

technicianSchema.index({ location: "2dsphere" });

export default mongoose.model("Technician", technicianSchema);
