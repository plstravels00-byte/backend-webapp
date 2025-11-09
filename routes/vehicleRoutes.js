import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import vehicleCtrl from "../controllers/vehicleController.js";
import upload from "../middleware/upload.js";

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

// ✅ Get vehicles by branch - FIXED
router.get("/branch/:branchId", verifyToken, vehicleCtrl.getByBranch);

export default router;
