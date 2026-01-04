import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ⚠️ TEMP MOCK MODELS (testing purpose)
// Later replace with real mongoose models
const Users = [
  { id: 1, name: "Admin", mobile: "9025174373", role: "admin", password: bcrypt.hashSync("123456", 10) },
];

const Drivers = [
  { id: 2, name: "Driver One", mobile: "8765432109", role: "driver", isApproved: true },
];

const router = express.Router();

/* ========================================================= */
/* 🔍 TEST ROUTE */
/* ========================================================= */
router.get("/test", (req, res) => {
  res.json({ ok: true, message: "AUTH ROUTES WORKING ✅" });
});

/* ========================================================= */
/* 🔐 PASSWORD LOGIN */
/* ========================================================= */
router.post("/login", async (req, res) => {
  try {
    let { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({ message: "Mobile & password required" });
    }

    mobile = mobile.replace(/\D/g, "").slice(-10);

    const user = Users.find((u) => u.mobile === mobile);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "devsecret",
      { expiresIn: "7d" }
    );

    res.json({ message: "Login success", token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ========================================================= */
/* 📲 OTP LOGIN (BACKEND ONLY – FIREBASE VERIFY FRONTEND) */
/* ========================================================= */
router.post("/otp-login", async (req, res) => {
  try {
    let { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({ message: "Mobile required" });
    }

    mobile = mobile.replace(/\D/g, "").slice(-10);

    let user = Users.find((u) => u.mobile === mobile);
    let role = "user";

    if (!user) {
      user = Drivers.find((d) => d.mobile === mobile);
      role = "driver";
    }

    if (!user) {
      return res.status(404).json({ message: "User not registered" });
    }

    if (role === "driver" && user.isApproved === false) {
      return res.status(403).json({ message: "Driver pending approval" });
    }

    const token = jwt.sign(
      { id: user.id, role },
      process.env.JWT_SECRET || "devsecret",
      { expiresIn: "7d" }
    );

    res.json({
      message: "OTP login successful ✅",
      token,
      user,
    });
  } catch (err) {
    console.error("OTP login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
