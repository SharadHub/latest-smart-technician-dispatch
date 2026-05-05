import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, unique: true },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: "Technician", required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  stars: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, maxlength: 500, default: "" },
}, { timestamps: true });

ratingSchema.index({ technician: 1 });
ratingSchema.index({ client: 1 });

export default mongoose.model("Rating", ratingSchema);
