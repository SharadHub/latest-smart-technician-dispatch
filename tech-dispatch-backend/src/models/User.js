import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    unique: true, 
    index: true, 
    required: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.']
  },
  password: { 
    type: String, 
    required: true, 
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false 
  },
  phone: {
    type: String,
    match: [/^(?:\+?977[- \s]?)?(?:98|97|96)\d{8}$/, 'Please provide a valid Nepali phone number (e.g. 98...)']
  },
  role: { type: String, enum: ["user", "technician", "admin"], default: "user", index: true },
  location: {
    city: String,
    lat: Number,
    lng: Number
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
