import express from "express";
import { assignToDriver, getAssignedForBranch } from "../controllers/assignSalaryController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/assign", verifyToken, assignToDriver);
router.get("/assigned", verifyToken, getAssignedForBranch);

export default router;
