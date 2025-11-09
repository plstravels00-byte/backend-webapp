import express from "express";
import multer from "multer";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Driver from "../models/Driver.js";
import User from "../models/User.js";

const router = express.Router();

/* ===========================
   📂 Multer Storage Setup
=========================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/drivers/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.fieldname + path.extname(file.originalname));
  },
});

const upload = multer({ storage }).fields([
  { name: "aadharFront", maxCount: 1 },
  { name: "aadharBack", maxCount: 1 },
  { name: "dlFront", maxCount: 1 },
  { name: "dlBack", maxCount: 1 },
  { name: "panUpload", maxCount: 1 },
  { name: "selfie", maxCount: 1 },
]);

/* ===========================
   🟢 DRIVER REGISTRATION
=========================== */
router.post("/register", upload, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      mobile,
      email,
      password,
      confirmPassword,
      refNumber,
      refNumber2,
      aadharNumber,
      dlNumber,
      panNumber,
      address,
      branch,
    } = req.body;

    if (!firstName || !mobile || !email || !password)
      return res.status(400).json({ message: "Missing required fields" });

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    const existing = await Driver.findOne({ mobile });
    if (existing)
      return res.status(400).json({ message: "Mobile already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const files = req.files;
    const newDriver = new Driver({
      name: firstName,
      lastName,
      mobile,
      email,
      password: hashedPassword,
      refNumber,
      refNumber2,
      aadharNumber,
      dlNumber,
      panNumber,
      address,
      branch,
      aadharFront: files?.aadharFront?.[0]?.path || null,
      aadharBack: files?.aadharBack?.[0]?.path || null,
      dlFront: files?.dlFront?.[0]?.path || null,
      dlBack: files?.dlBack?.[0]?.path || null,
      panUpload: files?.panUpload?.[0]?.path || null,
      selfieUrl: files?.selfie?.[0]?.path || null,
      isApproved: false,
      status: "waiting",
    });

    await newDriver.save();
    res.json({ message: "Driver registered successfully! Waiting for approval." });
  } catch (err) {
    console.error("Driver registration error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ===========================
   🔐 UNIVERSAL LOGIN
=========================== */
router.post("/login", async (req, res) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password)
      return res.status(400).json({ message: "Mobile and password required" });

    // 🟢 1️⃣ Admin/Manager/Supervisor/Tech Users
    const user = await User.findOne({ mobile });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({ message: "Invalid password" });

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        message: "Login successful",
        role: user.role,
        token,
        user,
      });
    }

    // 🟡 2️⃣ Drivers
    const driver = await Driver.findOne({ mobile });
    if (driver) {
      const isMatch = await bcrypt.compare(password, driver.password);
      if (!isMatch)
        return res.status(400).json({ message: "Invalid password" });

      // 🚫 Not yet approved
      if (!driver.isApproved || driver.status !== "active") {
        return res.status(403).json({
          message: "Waiting for manager approval",
          status: "waiting",
        });
      }

      const token = jwt.sign(
        { id: driver._id, role: "driver" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        message: "Driver login successful",
        role: "driver",
        token,
        user: driver,
      });
    }

    // ❌ Not found
    res.status(404).json({ message: "User not found" });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
