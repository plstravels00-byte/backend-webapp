import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Driver from "../models/Driver.js";

const router = express.Router();

/* ========================================================================= */
/* 🔐 PASSWORD LOGIN (EXISTING – KEEP THIS) */
/* ========================================================================= */
router.post("/login", async (req, res) => {
  try {
    let { mobile, password } = req.body;

    if (!mobile || !password) {
      return res
        .status(400)
        .json({ message: "Mobile and password required" });
    }

    // ✅ normalize mobile
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
      return res
        .status(403)
        .json({ message: "Your account is pending approval." });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: role === "driver" ? "driver" : user.role,
        branch: user.branch ? user.branch._id : null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name || `${user.firstName} ${user.lastName}`,
        mobile: user.mobile,
        role: role === "driver" ? "driver" : user.role,
        branch: user.branch
          ? { id: user.branch._id, name: user.branch.name }
          : null,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

/* ========================================================================= */
/* 📲 OTP LOGIN (PASSWORDLESS – FINAL FIXED VERSION) */
/* ========================================================================= */
router.post("/otp-login", async (req, res) => {
  try {
    let { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({ message: "Mobile number required" });
    }

    // ✅ CRITICAL FIX: normalize mobile (always 10 digits)
    mobile = mobile.replace(/\D/g, "").slice(-10);

    let user = await User.findOne({ mobile }).populate("branch", "name");
    let role = "user";

    if (!user) {
      user = await Driver.findOne({ mobile }).populate("branch", "name");
      role = "driver";
    }

    // ❗ user not registered
    if (!user) {
      return res.status(404).json({
        message: "User not registered",
        action: "REGISTER",
      });
    }

    // ❗ driver approval check
    if (role === "driver" && user.isApproved === false) {
      return res.status(403).json({
        message: "Your account is pending approval.",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: role === "driver" ? "driver" : user.role,
        branch: user.branch ? user.branch._id : null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "OTP login successful",
      token,
      user: {
        id: user._id,
        name: user.name || `${user.firstName} ${user.lastName}`,
        mobile: user.mobile,
        role: role === "driver" ? "driver" : user.role,
        branch: user.branch
          ? { id: user.branch._id, name: user.branch.name }
          : null,
      },
    });
  } catch (err) {
    console.error("OTP Login Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
