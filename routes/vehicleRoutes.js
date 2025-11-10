import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import vehicleCtrl from "../controllers/vehicleController.js";
import upload from "../middleware/upload.js";
import Vehicle from "../models/Vehicle.js";

const router = express.Router();

// Add vehicle
router.post(
  "/add",
  verifyToken,
  upload.fields([
    { name: "rcBook", maxCount: 1 },
    { name: "insurance", maxCount: 1 },
    { name: "permit", maxCount: 1 },
    { name: "fitness", maxCount: 1 },
  ]),
  vehicleCtrl.addVehicle
);

// ✅ Get vehicles by branch
router.get("/branch/:branchId", verifyToken, vehicleCtrl.getByBranch);

// ✅ Delete Vehicle
router.delete("/delete/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await Vehicle.findByIdAndDelete(id);
    res.json({ success: true, message: "Vehicle Deleted Successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error deleting vehicle" });
  }
});

export default router;
