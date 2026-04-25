import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  technicianId: { type: mongoose.Schema.Types.ObjectId, ref: "Technician", default: null },
  serviceType: String,
  status: {
    type: String,
    enum: ["requested", "accepted", "in-progress", "completed", "failed", "rejected", "expired", "cancelled"],
    default: "requested",
    index: true
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
      respondedAt: Date,
      distance: { type: Number, default: 0 },
      rank: { type: Number, default: 1 }
    }
  ]
}, { timestamps: true });

// Compound indexes for common queries
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ technicianId: 1, status: 1 });
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ status: 1, expiresAt: 1 });

export default mongoose.model("Booking", bookingSchema);
