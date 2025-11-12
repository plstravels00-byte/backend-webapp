import express from "express";
import {
  createReward,
  listDriverWallet,
  listPending,
  approveTxn,
} from "../controllers/walletController.js";
import DriverWallet from "../models/DriverWallet.js";
import Driver from "../models/Driver.js";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/* -------------------------------------------------------------------------- */
/* 🟢 MANAGER / ADMIN: ADD REWARD (Pending Approval) */
/* -------------------------------------------------------------------------- */
router.post("/create", verifyToken, allowRoles("manager", "admin"), createReward);

router.post("/add", verifyToken, allowRoles("manager", "admin"), async (req, res) => {
  try {
    const { driverId, branchId, amount, reason, addedBy } = req.body;

    if (!driverId || !amount) {
      return res.status(400).json({ success: false, message: "Driver and amount required" });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver not found" });
    }

    const newReward = await DriverWallet.create({
      driverId,
      branchId,
      amount: Number(amount),
      reason,
      addedBy,
      status: "pending",
    });

    res.json({
      success: true,
      message: "Reward Added (Pending Admin Approval)",
      data: newReward,
    });
  } catch (err) {
    console.error("Error adding reward:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/* -------------------------------------------------------------------------- */
/* 🟡 ADMIN: LIST PENDING REWARDS */
/* -------------------------------------------------------------------------- */
router.get("/pending", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const pending = await DriverWallet.find({ status: "pending" })
      .populate("driverId", "name mobile branch")
      .populate("addedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: pending });
  } catch (err) {
    console.error("Error listing pending rewards:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/* -------------------------------------------------------------------------- */
/* 🟢 ADMIN: APPROVE REWARD */
/* -------------------------------------------------------------------------- */
router.put("/approve/:id", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const reward = await DriverWallet.findById(req.params.id);
    if (!reward) {
      return res.status(404).json({ success: false, message: "Reward not found" });
    }

    reward.status = "approved";
    reward.approvedBy = req.user._id;
    reward.approvedAt = new Date();

    await reward.save();

    res.json({ success: true, message: "Reward Approved", data: reward });
  } catch (err) {
    console.error("Error approving reward:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/* -------------------------------------------------------------------------- */
/* 🔴 ADMIN: REJECT REWARD */
/* -------------------------------------------------------------------------- */
router.put("/reject/:id", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const reward = await DriverWallet.findById(req.params.id);
    if (!reward) {
      return res.status(404).json({ success: false, message: "Reward not found" });
    }

    reward.status = "rejected";
    reward.approvedBy = req.user._id;
    reward.approvedAt = new Date();

    await reward.save();

    res.json({ success: true, message: "Reward Rejected", data: reward });
  } catch (err) {
    console.error("Error rejecting reward:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/* -------------------------------------------------------------------------- */
/* 🟢 ADMIN: LIST ALL APPROVED REWARDS */
/* -------------------------------------------------------------------------- */
router.get("/driver/all-approved", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const approved = await DriverWallet.find({ status: "approved" })
      .populate("driverId", "name mobile branch")
      .populate("addedBy", "name email")
      .sort({ updatedAt: -1 });

    res.json({ success: true, data: approved });
  } catch (err) {
    console.error("Error listing approved rewards:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/* -------------------------------------------------------------------------- */
/* 🟢 DRIVER: VIEW OWN WALLET (APPROVED ONLY) */
/* -------------------------------------------------------------------------- */
router.get("/driver/:driverId", verifyToken, async (req, res) => {
  try {
    const driverId = req.params.driverId;

    const rewards = await DriverWallet.find({
      driverId,
      status: { $regex: /^approved$/i },
    })
      .populate("addedBy", "name email")
      .sort({ createdAt: -1 });

    const total = rewards.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    res.json({
      success: true,
      total: Number(total.toFixed(2)),
      walletItems: rewards,
    });
  } catch (err) {
    console.error("Error fetching driver wallet:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/* -------------------------------------------------------------------------- */
/* 🟢 OPTIONAL: GENERIC ADMIN APPROVE/REJECT ENDPOINT */
/* -------------------------------------------------------------------------- */
router.put("/:txnId/:action", verifyToken, allowRoles("admin"), approveTxn);

export default router;
