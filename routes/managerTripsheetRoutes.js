import express from "express";
import mongoose from "mongoose";
import Trip from "../models/Tripsheet.js";
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

      // handle both ObjectId and string stored IDs
      const query = mongoose.isValidObjectId(branchId)
        ? { branchId: new mongoose.Types.ObjectId(branchId), status: "completed" }
        : { branchId, status: "completed" };

      const trips = await Trip.find(query)
        .populate("driverId", "name mobile email")
        .sort({ updatedAt: -1 });

      console.log("✅ Trips fetched:", trips.length);

      if (!trips.length)
        return res.status(404).json({ message: "No completed trips found" });

      res.json(trips);
    } catch (err) {
      console.error("❌ Error fetching completed trips:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
