import express from "express";
import Invite from "../models/Invite.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

// ⭐ Create invite link
router.post("/telecaller/create", async (req, res) => {
  try {
    const { days } = req.body;
    const token = Math.random().toString(36).slice(2, 12);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (days || 2));

    await Invite.create({
      token,
      role: "telecaller",
      status: "unused",
      expiresAt,
    });

    return res.json({
      ok: true,
      inviteLink: `https://plstravels.com/invite/telecaller/${token}`,
      token,
    });
  } catch (error) {
    console.log("Invite Create Error:", error);
    res.status(500).json({ ok: false, message: "Error generating invite link" });
  }
});

// ⭐ Verify token
router.get("/telecaller/verify/:token", async (req, res) => {
  try {
    const invite = await Invite.findOne({
      token: req.params.token,
      status: "unused",
      expiresAt: { $gt: new Date() },
    });

    if (!invite) return res.status(400).json({ ok: false, message: "Invalid or expired token" });

    return res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Server error" });
  }
});

// ⭐ Telecaller Register
router.post("/telecaller/register/:token", async (req, res) => {
  try {
    const { name, mobile, password } = req.body;

    const invite = await Invite.findOne({
      token: req.params.token,
      status: "unused",
    });

    if (!invite) return res.status(400).json({ message: "Invalid invite link!" });

    const hashed = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      mobile,
      password: hashed,
      role: "telecaller",
    });

    invite.status = "used";
    await invite.save();

    const t = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({ message: "Telecaller registered successfully", token: t, user: newUser });

  } catch (err) {
    console.log("Telecaller Register Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
