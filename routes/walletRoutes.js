// server/routes/walletRoutes.js
import express from "express";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";
import { createReward, listDriverWallet, listPending, approveTxn } from "../controllers/walletController.js";

const router = express.Router();

// Manager creates reward request for a driver (pending)
router.post("/create", verifyToken, allowRoles("manager", "admin"), createReward);

// Driver views own wallet
router.get("/driver/:driverId", verifyToken, allowRoles("driver", "manager", "admin"), listDriverWallet);

// Admin: list pending requests
router.get("/pending", verifyToken, allowRoles("admin"), listPending);

// Admin approve/reject
router.post("/approve/:txnId", verifyToken, allowRoles("admin"), approveTxn);

export default router;
