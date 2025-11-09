import express from "express";
import assignCtrl from "../controllers/assignSalaryController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Assign Salary to Driver
router.post("/", verifyToken, assignCtrl.assignToDriver);

// Get Assigned Drivers for Branch
router.get("/branch", verifyToken, assignCtrl.getAssignedForBranch);

// Quick Salary Calculation
router.get("/calc/:driverId", verifyToken, assignCtrl.calculateSalary);

export default router;
