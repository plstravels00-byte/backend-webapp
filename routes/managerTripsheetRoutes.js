import express from "express";
import mongoose from "mongoose";
import Trip from "../models/Tripsheet.js";   // <-- FIXED (import correct model)
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/tripsheet/:branchId",
  verifyToken,
  allowRoles("manager", "admin"),
  async (req, res) => {
    try {
      const { branchId } = req.params;

      console.log("📡 Fetching completed trips for branch:", branchId);

      const query = {
        branchId: new mongoose.Types.ObjectId(branchId),
        status: "completed",
      };

      const trips = await Trip.find(query)
        .populate("driverId", "name mobile email")
        .populate("vehicleId", "vehicleNumber model")
        .sort({ updatedAt: -1 });

      console.log("Fetched trips:", trips.length);

      res.json(trips);
    } catch (err) {
      console.error("❌ Error fetching completed trips:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
