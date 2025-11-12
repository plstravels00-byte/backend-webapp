import express from "express";
import {
  createReward,
  listDriverWallet,
  listPending,
  approveTxn,
} from "../controllers/walletController.js";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * 🟢 Manager adds reward (pending)
 */
router.post("/create", verifyToken, allowRoles("manager", "admin"), createReward);

/**
 * 🔵 Admin/Manager: View pending rewards
 */
router.get("/pending", verifyToken, allowRoles("admin"), async (req, res, next) => {
  try {
    const data = await listPending(req, res);
    return data;
  } catch (err) {
    next(err);
  }
});

/**
 * 🟢 Admin approves/rejects a transaction
 * (action = approve / reject)
 */
router.put("/:txnId/:action", verifyToken, allowRoles("admin"), approveTxn);

/**
 * 🟢 Driver: View wallet balance + history
 */
router.get("/driver/:driverId", verifyToken, listDriverWallet);

/**
 * 🟢 Admin: Get all approved transactions
 */
router.get("/approved", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const approved = await WalletTxn.find({ status: "approved" })
      .populate("driverId", "name mobile")
      .populate("addedBy", "name email")
      .sort({ updatedAt: -1 });
    res.json({ success: true, data: approved });
  } catch (err) {
    console.error("listApproved:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
