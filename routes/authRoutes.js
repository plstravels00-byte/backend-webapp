import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Driver from "../models/Driver.js";

const router = express.Router();

/* ========================================================= */
/* 🔍 TEST ROUTE – MUST WORK (DEBUG PURPOSE) */
/* ========================================================= */
router.get("/test", (req, res) => {
  res.json({ ok: true, message: "AUTH ROUTES WORKING" });
});

/* ========================================================= */
/* 🔐 PASSWORD LOGIN */
/* ========================================================= */
router.post("/login", async (req, res) => {
  try {
    let { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({ message: "Mobile and password required" });
    }

    // normalize mobile
    mobile = mobile.replace(/\D/g, "").slice(-10);

    let user = await User.findOne({ mobile });
    let role = "user";

    if (!user) {
      user = await Driver.findOne({ mobile });
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
      return res.status(403).json({ message: "Driver pending approval" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: role === "driver" ? "driver" : user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        role: role === "driver" ? "driver" : user.role,
      },
    });
  } catch (err) {
    console.error("Password login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ========================================================= */
/* 📲 OTP LOGIN (NO PASSWORD – FINAL) */
/* ========================================================= */
router.post("/otp-login", async (req, res) => {
  try {
    let { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({ message: "Mobile number required" });
    }

    // normalize mobile
    mobile = mobile.replace(/\D/g, "").slice(-10);

    let user = await User.findOne({ mobile });
    let role = "user";

    if (!user) {
      user = await Driver.findOne({ mobile });
      role = "driver";
    }

    if (!user) {
      return res.status(404).json({
        message: "User not registered",
        action: "REGISTER",
      });
    }

    if (role === "driver" && user.isApproved === false) {
      return res.status(403).json({
        message: "Driver pending approval",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: role === "driver" ? "driver" : user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "OTP login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        role: role === "driver" ? "driver" : user.role,
      },
    });
  } catch (err) {
    console.error("OTP login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
