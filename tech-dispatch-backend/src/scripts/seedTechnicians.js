import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const seedTechnicians = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Clean and create admin
    const adminEmail = 'admin@techdispatch.com';
    await User.deleteOne({ email: adminEmail, role: 'admin' });
    
    await User.create({
      name: 'System Admin',
      email: adminEmail,
      password: 'admin123', // Plain text - User model will hash this automatically
      phone: '9800000001',
      role: 'admin',
    });
  } catch (error) {
    console.error("Error seeding admin:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run the seeding function
seedTechnicians();