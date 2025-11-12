// server/routes/walletRoutes.js
import express from "express";
import {
  createReward,
  listDriverWallet,
  listPending,
  approveTxn,
} from "../controllers/walletController.js";
import mongoose from "mongoose";
import DriverWallet from "../models/DriverWallet.js";
import Driver from "../models/Driver.js";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * 🟢 Manager adds reward (pending)
 * 🟢 Manager adds reward (goes to admin for approval)
*/
router.post("/create", verifyToken, allowRoles("manager", "admin"), createReward);
router.post("/add", verifyToken, allowRoles("manager", "admin"), async (req, res) => {
  try {
    const { driverId, branchId, amount, reason, addedBy } = req.body;

    // ✅ Validate driver
    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });

    const newReward = await DriverWallet.create({
      driverId,
      branchId,
      amount,
      reason,
      addedBy,
      status: "pending",
    });

    res.json({ success: true, message: "Reward Added (Pending Approval)", data: newReward });
  } catch (err) {
    console.error("Error adding reward:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/**
 * 🔵 Admin/Manager: View pending rewards
 * 🟢 Admin approves reward
*/
router.get("/pending", verifyToken, allowRoles("admin"), async (req, res, next) => {
router.put("/approve/:id", verifyToken, allowRoles("admin"), async (req, res) => {
try {
    const data = await listPending(req, res);
    return data;
    const updated = await DriverWallet.findByIdAndUpdate(
      req.params.id,
      { status: "approved", approvedAt: new Date(), approvedBy: req.user._id },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Reward not found" });
    res.json({ success: true, message: "Reward Approved", data: updated });
} catch (err) {
    next(err);
    console.error("Error approving reward:", err);
    res.status(500).json({ success: false, message: "Server Error" });
}
});

/**
 * 🟢 Admin approves/rejects a transaction
 * (action = approve / reject)
 * 🔴 Admin rejects reward
*/
router.put("/:txnId/:action", verifyToken, allowRoles("admin"), approveTxn);
router.put("/reject/:id", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const updated = await DriverWallet.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", approvedAt: new Date(), approvedBy: req.user._id },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Reward not found" });
    res.json({ success: true, message: "Reward Rejected", data: updated });
  } catch (err) {
    console.error("Error rejecting reward:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/**
 * 🟢 Driver: View wallet balance + history
 * 🟢 Admin - List all pending rewards
*/
router.get("/driver/:driverId", verifyToken, listDriverWallet);
router.get("/pending", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const pending = await DriverWallet.find({ status: "pending" })
      .populate("driverId", "name mobile")
      .populate("addedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: pending });
  } catch (err) {
    console.error("Error listing pending rewards:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/**
 * 🟢 Admin: Get all approved transactions
 * 🟢 Admin - List all approved rewards (for admin dashboard)
*/
router.get("/approved", verifyToken, allowRoles("admin"), async (req, res) => {
router.get("/driver/all-approved", verifyToken, allowRoles("admin"), async (req, res) => {
try {
    const approved = await WalletTxn.find({ status: "approved" })
    const approved = await DriverWallet.find({ status: "approved" })
.populate("driverId", "name mobile")
.populate("addedBy", "name email")
.sort({ updatedAt: -1 });

res.json({ success: true, data: approved });
} catch (err) {
    console.error("listApproved:", err);
    res.status(500).json({ message: "Server error" });
    console.error("Error listing approved rewards:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/**
 * 🟢 Driver - Get wallet balance + history (only approved)
 */
router.get("/driver/:driverId", verifyToken, async (req, res) => {
  try {
    const rewards = await DriverWallet.find({
      driverId: req.params.driverId,
      status: "approved",
    }).sort({ createdAt: -1 });

    const total = rewards.reduce((sum, item) => sum + item.amount, 0);
    res.json({ success: true, total, walletItems: rewards });
  } catch (err) {
    console.error("Error fetching driver wallet:", err);
    res.status(500).json({ success: false, message: "Server Error" });
}
});
