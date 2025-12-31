import express from "express";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";
import upload from "../middleware/cloudinaryUpload.js";

// ⭐ Import Controller Methods
import {
  registerDriver,
  getPendingDrivers,
  approveDriver,
  rejectDriver,
  getApprovedDrivers,
} from "../controllers/driverController.js";

const router = express.Router();

/* 🔵 Register Route */
router.post(
  "/register",
  upload.fields([
    { name: "aadharFront", maxCount: 1 },
    { name: "aadharBack", maxCount: 1 },
    { name: "dlFront", maxCount: 1 },
    { name: "dlBack", maxCount: 1 },
    { name: "panUpload", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
  ]),
  registerDriver
);

/* 🟡 Pending Drivers */
router.get(
  "/pending",
  verifyToken,
  allowRoles("admin", "manager"),
  getPendingDrivers
);

/* 🟢 Approve Driver */
router.patch(
  "/:id/approve",
  verifyToken,
  allowRoles("admin", "manager"),
  approveDriver
);

/* 🔴 Reject Driver */
router.delete(
  "/:id/reject",
  verifyToken,
  allowRoles("admin", "manager"),
  rejectDriver
);

/* 🟢 Approved Drivers */
router.get(
  "/approved",
  verifyToken,
  allowRoles("admin", "manager"),
  getApprovedDrivers
);

export default router;
