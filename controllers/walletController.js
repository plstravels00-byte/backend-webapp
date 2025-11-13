import DriverWallet from "../models/DriverWallet.js";
import Driver from "../models/Driver.js";
import mongoose from "mongoose";

/* -------------------------------------------------------------------------- */
/* 🟢 MANAGER / ADMIN: ADD TRANSACTION (Add / Less) */
/* -------------------------------------------------------------------------- */
export const createTransaction = async (req, res) => {
  try {
    const { driverId, branchId, amount, reason, type, addedBy, action } = req.body;

    if (!driverId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Driver and amount are required",
      });
    }

    // Validate driver existence
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver not found" });
    }

    // ✅ Always store positive amount
    const absAmount = Math.abs(Number(amount));

    // Create transaction
    const txn = await DriverWallet.create({
      driverId: mongoose.Types.ObjectId(driverId),
      branchId,
      amount: absAmount,
      reason: reason || `${type} ${action === "less" ? "deducted" : "added"}`,
      addedBy,
      type,
      action,
      status: "pending",
    });

    res.json({
      success: true,
      message: `${type || "Reward"} ${action === "less" ? "Deducted" : "Added"} (Pending Admin Approval)`,
      data: txn,
    });
  } catch (err) {
    console.error("createTransaction:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
};

/* -------------------------------------------------------------------------- */
/* 🟡 ADMIN: LIST PENDING TRANSACTIONS */
/* -------------------------------------------------------------------------- */
export const listPending = async (req, res) => {
  try {
    const pending = await DriverWallet.find({ status: "pending" })
      .populate("driverId", "name mobile branch")
      .populate("addedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: pending });
  } catch (err) {
    console.error("listPending:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* -------------------------------------------------------------------------- */
/* 🟢 ADMIN: APPROVE OR REJECT TRANSACTION */
/* -------------------------------------------------------------------------- */
export const approveOrReject = async (req, res) => {
  try {
    const { txnId } = req.params;
    const { action } = req.body; // approve / reject
    const adminId = req.user._id;

    const txn = await DriverWallet.findById(txnId);
    if (!txn) return res.status(404).json({ success: false, message: "Transaction not found" });
    if (txn.status !== "pending")
      return res.status(400).json({ success: false, message: "Transaction already processed" });

    if (action === "reject") {
      txn.status = "rejected";
    } else {
      txn.status = "approved";
    }

    txn.approvedBy = adminId;
    txn.approvedAt = new Date();

    await txn.save();

    res.json({
      success: true,
      message: `Transaction ${txn.status.toUpperCase()}`,
      data: txn,
    });
  } catch (err) {
    console.error("approveOrReject:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* -------------------------------------------------------------------------- */
/* 🟢 DRIVER: VIEW WALLET DETAILS */
/* -------------------------------------------------------------------------- */
export const viewDriverWallet = async (req, res) => {
  try {
    const { driverId } = req.params;

    const txns = await DriverWallet.find({
      driverId,
      status: "approved",
    })
      .populate("addedBy", "name email")
      .sort({ createdAt: -1 });

    // Group & total by action
    let totalAdd = 0;
    let totalLess = 0;

    txns.forEach((txn) => {
      if (txn.action === "add") totalAdd += txn.amount;
      else totalLess += txn.amount;
    });

    const netBalance = totalAdd - totalLess;

    res.json({
      success: true,
      totals: { totalAdd, totalLess, netBalance },
      data: txns,
    });
  } catch (err) {
    console.error("viewDriverWallet:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* -------------------------------------------------------------------------- */
/* 🟢 ADMIN: LIST ALL APPROVED (Grouped by Type) */
/* -------------------------------------------------------------------------- */
export const listApprovedGrouped = async (req, res) => {
  try {
    const approved = await DriverWallet.find({ status: "approved" })
      .populate("driverId", "name mobile branch")
      .populate("addedBy", "name email")
      .sort({ updatedAt: -1 });

    const grouped = { reward: [], advance: [], deposit: [], penalty: [] };
    approved.forEach((txn) => {
      if (txn.type && grouped[txn.type]) grouped[txn.type].push(txn);
    });

    res.json({ success: true, grouped });
  } catch (err) {
    console.error("listApprovedGrouped:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
