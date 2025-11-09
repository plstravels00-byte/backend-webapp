// createAdmin.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const existing = await User.findOne({ mobile: "9025174373" });

    if (existing) {
      console.log("⚠️ Admin already exists:", existing.mobile);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);
    const admin = new User({
      name: "Super Admin",
      mobile: "9025174373",
      password: hashedPassword,
      role: "admin",
    });

    await admin.save();
    console.log("✅ Admin created successfully:", admin);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating admin:", err);
    process.exit(1);
  }
};

createAdmin();
