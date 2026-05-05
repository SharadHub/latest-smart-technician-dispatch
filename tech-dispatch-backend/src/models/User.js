import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    unique: true,
    index: true,
    required: true,
    match: [/^\S+@\S+\.\S+$/, "Please use a valid email address."],
  },
  password: {
    type: String,
    required: true,
    minlength: [6, "Password must be at least 6 characters long"],
    select: false,
  },
  phone: { type: String },
  role: { type: String, enum: ["user", "technician", "admin"], default: "user", index: true },
  warnings: [
    {
      reason: { type: String, required: true },
      issuedAt: { type: Date, default: Date.now },
      issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  ],
}, { timestamps: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
