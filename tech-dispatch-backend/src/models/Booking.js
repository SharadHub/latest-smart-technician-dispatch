import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  technicianId: { type: mongoose.Schema.Types.ObjectId, ref: "Technician", default: null },
  serviceType: String,
  status: {
    type: String,
    enum: ["requested", "accepted", "in-progress", "completed", "failed", "rejected", "expired", "cancelled"],
    default: "requested"
  },
  expiresAt: {
    type: Date,
    index: true
  },
  acceptedAt: Date,
  cancelledAt: Date,
  failedAt: Date,
  completedAt: Date,
  radiusUsed: Number,
  statusHistory: [
    {
      status: String,
      triggeredBy: String,
      timestamp: { type: Date, default: Date.now }
    }
  ],
  requestQueue: [
    {
      technicianId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Technician"
      },
      status: {
        type: String,
        enum: ["pending", "accepted", "rejected", "expired"],
        default: "pending"
      },
      respondedAt: Date
    }
  ]
}, { timestamps: true });

export default mongoose.model("Booking", bookingSchema);
