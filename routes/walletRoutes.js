import express from "express";
import DriverWallet from "../models/DriverWallet.js";
import Driver from "../models/Driver.js";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/* Clean Unicode / unwanted characters like ¹, ₹, spaces */
const clean = (v) => Number(String(v).replace(/[^\d-]/g, "")) || 0;

/* -------------------------------------------------------------------------- */
/* 🟢 MANAGER / ADMIN: ADD / LESS TRANSACTION */
/* -------------------------------------------------------------------------- */
router.post("/add", verifyToken, allowRoles("manager", "admin"), async (req, res) => {
  try {
    const { driverId, branchId, amount, reason, type, addedBy, action } = req.body;

    if (!driverId || !amount)
      return res.status(400).json({ success: false, message: "Driver & amount are required" });

    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });

    const absAmount = Math.abs(clean(amount));

    const newEntry = await DriverWallet.create({
      driverId,
      branchId,
      amount: absAmount,
      reason,
      type,
      action: action || "add",
      addedBy,
      status: "pending",
    });

    res.json({ success: true, message: "Transaction Submitted (Pending Approval)", data: newEntry });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/* -------------------------------------------------------------------------- */
/* 🟡 LIST PENDING TRANSACTIONS */
/* -------------------------------------------------------------------------- */
router.get("/pending", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const pending = await DriverWallet.find({ status: "pending" })
      .populate("driverId", "name mobile branch")
      .populate("addedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: pending });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/* -------------------------------------------------------------------------- */
/* 🟢 APPROVE TRANSACTION */
/* -------------------------------------------------------------------------- */
router.put("/approve/:id", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const entry = await DriverWallet.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: "Transaction not found" });

    entry.status = "approved";
    entry.approvedAt = new Date();
    entry.approvedBy = req.user._id;
    await entry.save();

    res.json({ success: true, message: "Transaction Approved", data: entry });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/* -------------------------------------------------------------------------- */
/* 🛑 REJECT TRANSACTION */
/* -------------------------------------------------------------------------- */
router.put("/reject/:id", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const entry = await DriverWallet.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: "Transaction not found" });

    entry.status = "rejected";
    entry.approvedAt = new Date();
    entry.approvedBy = req.user._id;
    await entry.save();

    res.json({ success: true, message: "Transaction Rejected", data: entry });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/* -------------------------------------------------------------------------- */
/* ✔ ALL APPROVED TRANSACTIONS GROUPED By Type */
/* -------------------------------------------------------------------------- */
router.get("/all-approved", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const approved = await DriverWallet.find({ status: "approved" })
      .populate("driverId", "name mobile branch")
      .populate("addedBy", "name email")
      .sort({ approvedAt: -1 });

    const grouped = {
      reward: approved.filter((t) => t.type === "reward"),
      advance: approved.filter((t) => t.type === "advance"),
      deposit: approved.filter((t) => t.type === "deposit"),
      penalty: approved.filter((t) => t.type === "penalty"),
    };

    res.json({ success: true, grouped, total: approved.length });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/* -------------------------------------------------------------------------- */
/* 📘 DRIVER PASSBOOK WITH RUNNING BALANCE */
/* -------------------------------------------------------------------------- */
router.get("/driver/:driverId", verifyToken, async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await Driver.findById(driverId).select("name mobile");
    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });

    const entries = await DriverWallet.find({ driverId, status: "approved" }).sort({ createdAt: 1 });

    let balance = 0;
    const passbook = entries.map((t) => {
      const amt = (t.type === "reward" || t.type === "deposit") ? clean(t.amount) : -clean(t.amount);
      balance += amt;

      return {
        id: t._id,
        date: t.createdAt.toLocaleDateString("en-IN"),
        type: t.type,
        reason: t.reason,
        amount: amt,
        balance,
      };
    });

    res.json({ success: true, driver, passbook });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/* -------------------------------------------------------------------------- */
/* 📊 ALL DRIVER LEDGER SUMMARY */
/* -------------------------------------------------------------------------- */
router.get("/ledger/all-drivers", verifyToken, allowRoles("manager", "admin"), async (req, res) => {
  try {
    const drivers = await Driver.find({}).select("name mobile");

    const summary = await DriverWallet.aggregate([
      { $match: { status: "approved" } },
      {
        $group: {
          _id: "$driverId",
          reward: { $sum: { $cond: [{ $eq: ["$type", "reward"] }, "$amount", 0] }},
          advance: { $sum: { $cond: [{ $eq: ["$type", "advance"] }, "$amount", 0] }},
          deposit: { $sum: { $cond: [{ $eq: ["$type", "deposit"] }, "$amount", 0] }},
          penalty: { $sum: { $cond: [{ $eq: ["$type", "penalty"] }, "$amount", 0] }},
        },
      },
    ]);

    const result = drivers.map((d) => {
      const row = summary.find((x) => x._id?.toString() === d._id?.toString()) || {};
      const balance = (row.reward || 0) + (row.deposit || 0) - ((row.advance || 0) + (row.penalty || 0));
      return { driverId: d._id, name: d.name, mobile: d.mobile, ...row, balance };
    });

    res.json({ success: true, data: result });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

export default router;
