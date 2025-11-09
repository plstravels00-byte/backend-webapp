import express from "express";
import Driver from "../models/Driver.js";
import jwt from "jsonwebtoken";

const router = express.Router();

/* ----------------------------
   🔐 Middleware: Verify Token
---------------------------- */
const verifyToken = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "No token provided" });

  const token = header.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = decoded;
    next();
  });
};

/* ----------------------------
   🛰️ Update Driver Location
---------------------------- */
router.post("/update", verifyToken, async (req, res) => {
  try {
    const { driverId, lat, lng } = req.body;

    if (!driverId || !lat || !lng) {
      return res.status(400).json({ message: "Missing coordinates" });
    }

    await Driver.findByIdAndUpdate(driverId, {
      currentLocation: { lat, lng },
      lastUpdated: new Date(),
    });

    res.json({ message: "Location updated successfully" });
  } catch (err) {
    console.error("Location update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
