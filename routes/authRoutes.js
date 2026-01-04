import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Driver from "../models/Driver.js";

const router = express.Router();

/* ============================= */
/* 🔐 PASSWORD LOGIN */
/* ============================= */
router.post("/login", async (req, res) => {
  try {
    let { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({ message: "Mobile and password required" });
    }

    mobile = mobile.replace(/\D/g, "").slice(-10);

    let user = await User.findOne({ mobile }).populate("branch", "name");
    let role = "user";

    if (!user) {
      user = await Driver.findOne({ mobile }).populate("branch", "name");
      role = "driver";
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (role === "driver" && user.isApproved === false) {
      return res.status(403).json({ message: "Pending approval" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: role === "driver" ? "driver" : user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ============================= */
/* 📲 OTP LOGIN (IMPORTANT) */
/* ============================= */
router.post("/otp-login", async (req, res) => {
  try {
    let { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({ message: "Mobile required" });
    }

    mobile = mobile.replace(/\D/g, "").slice(-10);

    let user = await User.findOne({ mobile }).populate("branch", "name");
    let role = "user";

    if (!user) {
      user = await Driver.findOne({ mobile }).populate("branch", "name");
      role = "driver";
    }

    if (!user) {
      return res.status(404).json({ message: "User not registered" });
    }

    if (role === "driver" && user.isApproved === false) {
      return res.status(403).json({ message: "Pending approval" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: role === "driver" ? "driver" : user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user });
  } catch (err) {
    console.error("OTP login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
