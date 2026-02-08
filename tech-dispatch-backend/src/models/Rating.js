import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  technicianId: { type: mongoose.Schema.Types.ObjectId, ref: "Technician" },
  score: { type: Number, min: 1, max: 5 },
  comment: String
}, { timestamps: true });

export default mongoose.model("Rating", ratingSchema);
