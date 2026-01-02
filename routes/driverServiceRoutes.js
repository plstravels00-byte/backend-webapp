import express from "express";
import DriverService from "../models/DriverService.js";
import * as authModule from "../middleware/authMiddleware.js";

/**
 * ✅ Resolve auth middleware safely (no export mismatch ever)
 */
const auth =
  authModule.authMiddleware ||
  authModule.default ||
  authModule.verifyToken;

const router = express.Router();

/* ============== CREATE SERVICE RECORD ============== */
router.post("/create", auth, async (req, res) => {
  try {
    const {
      driverId,
      vehicleId,
      branchId,
      serviceDate,
      serviceCenter,
      description,
      cost,
    } = req.body;

    if (!driverId || !vehicleId || !branchId || !serviceDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const rec = await DriverService.create({
      driverId,
      vehicleId,
      branchId,
      serviceDate,
      serviceCenter,
      description,
      cost,
      createdBy: req.user?._id,
    });

    const populated = await DriverService.findById(rec._id)
      .populate("driverId", "name mobile")
      .populate("vehicleId", "vehicleNumber");

    res.json(populated);
  } catch (err) {
    console.error("DriverService create error:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ============== GET RECORDS BY BRANCH ============== */
router.get("/branch/:branchId", auth, async (req, res) => {
  try {
    const { branchId } = req.params;

    const records = await DriverService.find({ branchId })
      .populate("driverId", "name mobile")
      .populate("vehicleId", "vehicleNumber")
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (err) {
    console.error("DriverService list error:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
