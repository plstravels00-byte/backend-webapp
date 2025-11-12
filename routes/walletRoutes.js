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
/* 🟢 MANAGER / ADMIN: ADD REWARD / ADVANCE / DEPOSIT / PENALTY (Pending) */
/* -------------------------------------------------------------------------- */
router.post("/add", verifyToken, allowRoles("manager", "admin"), async (req, res) => {
  try {
    const { driverId, branchId, amount, reason, type, addedBy } = req.body;

    if (!driverId || !amount) {
      return res
        .status(400)
        .json({ success: false, message: "Driver and amount required" });
    }

    // Validate driver
    const driver = await Driver.findById(driverId);
    if (!driver)
      return res.status(404).json({ success: false, message: "Driver not found" });

    // ✅ Create wallet entry with type (reward/advance/deposit/penalty)
    const newEntry = await DriverWallet.create({
      driverId,
      branchId,
      amount: Number(amount),
      reason,
      type: type || "reward",
      addedBy,
      status: "pending",
    });

    res.json({
      success: true,
      message: `${type || "Reward"} Added (Pending Admin Approval)`,
      data: newEntry,
    });
  } catch (err) {
    console.error("Error adding wallet entry:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/* -------------------------------------------------------------------------- */
/* 🟡 ADMIN: LIST PENDING ENTRIES (ALL TYPES) */
/* -------------------------------------------------------------------------- */
router.get("/pending", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const pending = await DriverWallet.find({ status: "pending" })
      .populate("driverId", "name mobile branch")
      .populate("addedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: pending });
  } catch (err) {
    console.error("Error listing pending entries:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/* -------------------------------------------------------------------------- */
/* 🟢 ADMIN: APPROVE ENTRY */
/* -------------------------------------------------------------------------- */
router.put("/approve/:id", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const entry = await DriverWallet.findById(req.params.id);
    if (!entry)
      return res.status(404).json({ success: false, message: "Entry not found" });

    entry.status = "approved";
    entry.approvedBy = req.user._id;
    entry.approvedAt = new Date();

    await entry.save();

    res.json({ success: true, message: `${entry.type} Approved`, data: entry });
  } catch (err) {
    console.error("Error approving entry:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/* -------------------------------------------------------------------------- */
/* 🔴 ADMIN: REJECT ENTRY */
/* -------------------------------------------------------------------------- */
router.put("/reject/:id", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const entry = await DriverWallet.findById(req.params.id);
    if (!entry)
      return res.status(404).json({ success: false, message: "Entry not found" });

    entry.status = "rejected";
    entry.approvedBy = req.user._id;
    entry.approvedAt = new Date();

    await entry.save();

    res.json({ success: true, message: `${entry.type} Rejected`, data: entry });
  } catch (err) {
    console.error("Error rejecting entry:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/* -------------------------------------------------------------------------- */
/* 🟢 ADMIN: LIST ALL APPROVED ENTRIES (Grouped by Type) */
/* -------------------------------------------------------------------------- */
router.get("/all-approved", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const approved = await DriverWallet.find({ status: "approved" })
      .populate("driverId", "name mobile branch")
      .populate("addedBy", "name email")
      .sort({ updatedAt: -1 });

    // 🧠 Group by type
    const grouped = {
      reward: approved.filter((e) => e.type === "reward"),
      advance: approved.filter((e) => e.type === "advance"),
      deposit: approved.filter((e) => e.type === "deposit"),
      penalty: approved.filter((e) => e.type === "penalty"),
    };

    res.json({ success: true, grouped, totalCount: approved.length });
  } catch (err) {
    console.error("Error listing approved entries:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/* -------------------------------------------------------------------------- */
/* 🟢 DRIVER: VIEW OWN WALLET (Approved Only, All Types) */
/* -------------------------------------------------------------------------- */
router.get("/driver/:driverId", verifyToken, async (req, res) => {
  try {
    const driverId = req.params.driverId;

    const rewards = await DriverWallet.find({
      driverId,
      status: "approved",
    })
      .populate("addedBy", "name email")
      .sort({ createdAt: -1 });

    const totalRewards = rewards
      .filter((e) => e.type === "reward")
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const totalAdvance = rewards
      .filter((e) => e.type === "advance")
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const totalDeposit = rewards
      .filter((e) => e.type === "deposit")
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const totalPenalty = rewards
      .filter((e) => e.type === "penalty")
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    res.json({
      success: true,
      totals: {
        reward: totalRewards,
        advance: totalAdvance,
        deposit: totalDeposit,
        penalty: totalPenalty,
      },
      walletItems: rewards,
    });
  } catch (err) {
    console.error("Error fetching driver wallet:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/* -------------------------------------------------------------------------- */
/* 🟢 GENERIC ADMIN APPROVE/REJECT ENDPOINT (Optional) */
/* -------------------------------------------------------------------------- */
router.put("/:txnId/:action", verifyToken, allowRoles("admin"), approveTxn);

export default router;
