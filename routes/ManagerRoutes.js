// routes/managerRoutes.js
import express from "express";
import DriverDuty from "../models/DriverDuty.js"; // ✅ ensure model path is correct

const router = express.Router();

// ✅ Fetch completed trip sheets for a branch
router.get("/tripsheets/:branchId", async (req, res) => {
  try {
    const { branchId } = req.params;
    console.log("🧾 Fetching tripsheets for branch:", branchId);

    const trips = await DriverDuty.find({
      branchId,
      status: "completed",
    })
      .populate("driverId", "name mobile")
      .sort({ endTime: -1 });

    if (!trips.length) {
      return res.status(404).json({ message: "No completed trips found" });
    }

    res.json(trips);
  } catch (err) {
    console.error("❌ Error fetching tripsheets:", err);
    res.status(500).json({ message: "Server error while fetching tripsheets" });
  }
});

export default router;
