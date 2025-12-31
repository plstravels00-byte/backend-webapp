import express from "express";
import Maintenance from "../models/Maintenance.js";

// 🔴 IMPORTANT CHANGE HERE (NAMED IMPORT)
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ================= CREATE MAINTENANCE ISSUE ================= */
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { vehicleId, branchId, problemType, description } = req.body;

    if (!vehicleId || !branchId || !problemType || !description) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const issue = await Maintenance.create({
      vehicleId,
      branchId,
      problemType,
      description,
      status: "Open",
    });

    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================= GET ISSUES BY BRANCH ================= */
router.get("/branch/:branchId", authMiddleware, async (req, res) => {
  try {
    const { branchId } = req.params;

    const issues = await Maintenance.find({ branchId })
      .populate("vehicleId", "vehicleNumber")
      .sort({ createdAt: -1 });

    res.json(issues);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================= UPDATE STATUS ================= */
router.put("/update/:id", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    const updated = await Maintenance.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
