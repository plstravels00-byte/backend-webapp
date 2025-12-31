import DriverWallet from "../models/DriverWallet.js";
import Driver from "../models/Driver.js";
import mongoose from "mongoose";

/* 🔧 CLEAN NUMBER — remove unicode ¹ ² ₹ etc */
const cleanAmount = (v) => Number(String(v).replace(/[^\d-]/g, ""));

/* -------------------------------------------------------------------------- */
/* 🟢 MANAGER / ADMIN: ADD OR LESS TRANSACTION */
/* -------------------------------------------------------------------------- */
export const createTransaction = async (req, res) => {
  try {
    const { driverId, branchId, amount, reason, type, addedBy, action } = req.body;

    if (!driverId || !amount) {
      return res.status(400).json({ success: false, message: "Driver & amount required" });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });

    const absAmount = Math.abs(cleanAmount(amount));

    const txn = await DriverWallet.create({
      driverId: mongoose.Types.ObjectId(driverId),
      branchId,
      amount: absAmount,
      reason,
      type,
      action,
      addedBy,
      status: "pending",
    });

    res.json({
      success: true,
      message: `${type} ${action === "less" ? "Deducted" : "Added"} (Pending Approval)`,
      data: txn,
    });

  } catch (err) {
    console.error("createTransaction:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/* -------------------------------------------------------------------------- */
/* 🟡 LIST PENDING (ADMIN) */
/* -------------------------------------------------------------------------- */
export const listPending = async (req, res) => {
  try {
    const pending = await DriverWallet.find({ status: "pending" })
      .populate("driverId", "name mobile branch")
      .populate("addedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: pending });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/* -------------------------------------------------------------------------- */
/* 🟢 APPROVE / REJECT */
/* -------------------------------------------------------------------------- */
export const approveOrReject = async (req, res) => {
  try {
    const { txnId, action } = req.params;

    const txn = await DriverWallet.findById(txnId);
    if (!txn) return res.status(404).json({ success: false, message: "Not found" });

    txn.status = action === "reject" ? "rejected" : "approved";
    txn.approvedBy = req.user._id;
    txn.approvedAt = new Date();
    await txn.save();

    res.json({ success: true, message: `Transaction ${txn.status}`, data: txn });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/* -------------------------------------------------------------------------- */
/* ⭐ GET SINGLE DRIVER PASSBOOK => RUNNING BALANCE */
/* -------------------------------------------------------------------------- */
export const getDriverLedgerDetails = async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await Driver.findById(driverId).select("name mobile");
    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });

    const entries = await DriverWallet.find({ driverId, status: "approved" })
      .sort({ createdAt: 1 });

    let runningBalance = 0;

    const passbook = entries.map((t) => {
      const amountValue =
        t.type === "reward" || t.type === "deposit"
          ? cleanAmount(t.amount)
          : -cleanAmount(t.amount);

      runningBalance += amountValue;

      return {
        id: t._id,
        date: t.createdAt.toLocaleDateString("en-IN"),
        type: t.type,
        reason: t.reason,
        amount: amountValue,
        balance: runningBalance,
      };
    });

    res.json({ success: true, driver, passbook });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/* -------------------------------------------------------------------------- */
/* ⭐ MANAGER — ALL DRIVER LEDGER SUMMARY */
/* -------------------------------------------------------------------------- */
export const getAllDriversLedger = async (req, res) => {
  try {
    const drivers = await Driver.find({}).select("name mobile");

    const aggregated = await DriverWallet.aggregate([
      { $match: { status: "approved" } },
      {
        $group: {
          _id: "$driverId",
          reward: { $sum: { $cond: [{ $eq: ["$type", "reward"] }, "$amount", 0] }},
          advance: { $sum: { $cond: [{ $eq: ["$type", "advance"] }, "$amount", 0] }},
          deposit: { $sum: { $cond: [{ $eq: ["$type", "deposit"] }, "$amount", 0] }},
          penalty: { $sum: { $cond: [{ $eq: ["$type", "penalty"] }, "$amount", 0] }},
        }
      }
    ]);

    const result = drivers.map((d) => {
      const row = aggregated.find((x) => x._id?.toString() === d._id?.toString()) || {};
      const balance = (row.reward || 0) + (row.deposit || 0) - ((row.advance || 0) + (row.penalty || 0));

      return {
        driverId: d._id,
        name: d.name,
        mobile: d.mobile,
        reward: row.reward || 0,
        advance: row.advance || 0,
        deposit: row.deposit || 0,
        penalty: row.penalty || 0,
        balance,
      };
    });

    res.json({ success: true, data: result });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
