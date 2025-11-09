import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Driver from "../models/Driver.js";

const router = express.Router();

/**
 * Common login for:
 * - Admin
 * - Manager
 * - Supervisor
 * - Tech
 * - Driver
 */
router.post("/login", async (req, res) => {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password)
      return res.status(400).json({ message: "Mobile and password required" });

    // 🔹 Try to find user in both collections
    let user = await User.findOne({ mobile }).populate("branch", "name");
    let role = "user";

    if (!user) {
      user = await Driver.findOne({ mobile }).populate("branch", "name");
      role = "driver";
    }

    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // 🔹 If driver not approved yet
    if (role === "driver" && !user.isApproved)
      return res.status(403).json({ message: "Your account is pending approval." });

    // 🔹 Generate JWT token
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
        branch: user.branch ? { id: user.branch._id, name: user.branch.name } : null,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
