import DriverWallet from "../models/DriverWallet.js";
import Driver from "../models/Driver.js";
import mongoose from "mongoose";

/* -------------------------------------------------------------------------- */
/* 🟢 Manager/Admin: Create Transaction (Reward, Advance, Deposit, Penalty) */
/* -------------------------------------------------------------------------- */
export const createReward = async (req, res) => {
  try {
    const { driverId, amount, reason, type } = req.body;
    const addedBy = req.user?._id;

    if (!driverId || !amount || !type) {
      return res.status(400).json({ success: false, message: "Driver ID, amount, and type required" });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });

    const txn = await DriverWallet.create({
      driverId: mongoose.Types.ObjectId(driverId),
      amount: Number(amount),
      reason: reason || `${type} transaction added`,
      addedBy,
      status: "pending",
      type, // ✅ reward / advance / deposit / penalty
    });

    return res.json({
      success: true,
      message: `${type.toUpperCase()} created (Pending Admin Approval)`,
      txn,
    });
  } catch (err) {
    console.error("createReward:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* -------------------------------------------------------------------------- */
/* 🟡 Admin: List Pending Transactions */
/* -------------------------------------------------------------------------- */
export const listPending = async (req, res) => {
  try {
    const pending = await DriverWallet.find({ status: "pending" })
      .populate("driverId", "name mobile branch")
      .populate("addedBy", "name email")
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: pending });
  } catch (err) {
    console.error("listPending:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* -------------------------------------------------------------------------- */
/* 🟢 Admin: List All Approved Transactions (Grouped by Type) */
/* -------------------------------------------------------------------------- */
export const listApprovedGrouped = async (req, res) => {
  try {
    const approved = await DriverWallet.find({ status: "approved" })
      .populate("driverId", "name mobile branch")
      .populate("addedBy", "name email")
      .sort({ updatedAt: -1 });

    // ✅ Group by type
    const grouped = { reward: [], advance: [], deposit: [], penalty: [] };
    approved.forEach((txn) => {
      if (txn.type && grouped[txn.type]) grouped[txn.type].push(txn);
    });

    return res.json({ success: true, grouped });
  } catch (err) {
    console.error("listApprovedGrouped:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* -------------------------------------------------------------------------- */
/* 🟢 Driver: View Wallet (Grouped by Type) */
/* -------------------------------------------------------------------------- */
export const listDriverWallet = async (req, res) => {
  try {
    const { driverId } = req.params;

    const txns = await DriverWallet.find({
      driverId,
      status: "approved",
    })
      .populate("addedBy", "name email")
      .sort({ createdAt: -1 });

    // ✅ Group and calculate totals
    const grouped = { reward: [], advance: [], deposit: [], penalty: [] };
    const totals = { reward: 0, advance: 0, deposit: 0, penalty: 0 };

    txns.forEach((txn) => {
      if (txn.type && grouped[txn.type]) {
        grouped[txn.type].push(txn);
        totals[txn.type] += txn.amount;
      }
    });

    const netBalance = totals.reward + totals.deposit - (totals.advance + totals.penalty);

    return res.json({
      success: true,
      totals,
      netBalance,
      grouped,
    });
  } catch (err) {
    console.error("listDriverWallet:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* -------------------------------------------------------------------------- */
/* 🟢 Admin: Approve / Reject Transaction */
/* -------------------------------------------------------------------------- */
export const approveTxn = async (req, res) => {
  try {
    const { txnId } = req.params;
    const { action } = req.body; // "approve" or "reject"
    const adminId = req.user?._id;

    const txn = await DriverWallet.findById(txnId);
    if (!txn) return res.status(404).json({ message: "Transaction not found" });
    if (txn.status !== "pending")
      return res.status(400).json({ message: "Transaction already processed" });

    if (action === "reject") {
      txn.status = "rejected";
      txn.approvedBy = adminId;
      txn.approvedAt = new Date();
      await txn.save();
      return res.json({ success: true, message: "Transaction Rejected", txn });
    }

    txn.status = "approved";
    txn.approvedBy = adminId;
    txn.approvedAt = new Date();
    await txn.save();

    return res.json({ success: true, message: "Transaction Approved", txn });
  } catch (err) {
    console.error("approveTxn:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
