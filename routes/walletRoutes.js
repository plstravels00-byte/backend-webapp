import express from "express";
import DriverWallet from "../models/DriverWallet.js";
import Driver from "../models/Driver.js";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/* -------------------------------------------------------------------------- */
/* 🟢 MANAGER / ADMIN: ADD / LESS TRANSACTION (Reward, Advance, Deposit, Penalty) */
/* -------------------------------------------------------------------------- */
router.post("/add", verifyToken, allowRoles("manager", "admin"), async (req, res) => {
  try {
    const { driverId, branchId, amount, reason, type, addedBy, action } = req.body;

    if (!driverId || !amount) {
      return res
        .status(400)
        .json({ success: false, message: "Driver and amount are required" });
    }

    // Validate driver
    const driver = await Driver.findById(driverId);
    if (!driver)
      return res.status(404).json({ success: false, message: "Driver not found" });

    // ✅ Always keep amount positive, store action separately
    const absAmount = Math.abs(Number(amount));

    const newEntry = await DriverWallet.create({
      driverId,
      branchId,
      amount: absAmount,
      reason: reason || `${type} ${action === "less" ? "deducted" : "added"}`,
      type: type || "reward",
      action: action || "add", // ➕ or ➖
      addedBy,
      status: "pending",
    });

    res.json({
      success: true,
      message: `${type || "Reward"} ${
        action === "less" ? "Deducted" : "Added"
      } (Pending Admin Approval)`,
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

    res.json({
      success: true,
      message: `${entry.type.toUpperCase()} Approved`,
      data: entry,
    });
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

    res.json({
      success: true,
      message: `${entry.type.toUpperCase()} Rejected`,
      data: entry,
    });
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
/* 🟢 DRIVER: VIEW OWN WALLET (Approved Only, With Net Balance) */
/* -------------------------------------------------------------------------- */
router.get("/driver/:driverId", verifyToken, async (req, res) => {
  try {
    const driverId = req.params.driverId;

    const entries = await DriverWallet.find({
      driverId,
      status: "approved",
    })
      .populate("addedBy", "name email")
      .sort({ createdAt: -1 });

    // ✅ Calculate total credit / debit
    let totalAdd = 0;
    let totalLess = 0;

    entries.forEach((txn) => {
      if (txn.action === "add") totalAdd += txn.amount;
      else totalLess += txn.amount;
    });

    const netBalance = totalAdd - totalLess;

    res.json({
      success: true,
      totals: { totalAdd, totalLess, netBalance },
      walletItems: entries,
    });
  } catch (err) {
    console.error("Error fetching driver wallet:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

export default router;
