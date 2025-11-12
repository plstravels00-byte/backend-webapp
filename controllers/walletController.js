import DriverWallet from "../models/DriverWallet.js";
import Driver from "../models/Driver.js";
import mongoose from "mongoose";

/* -------------------------------------------------------------------------- */
/* 🟢 Manager/Admin: Create Reward (Pending Approval) */
/* -------------------------------------------------------------------------- */
export const createReward = async (req, res) => {
  try {
    const { driverId, amount, remark } = req.body;
    const addedBy = req.user?._id;

    if (!driverId || !amount) {
      return res.status(400).json({ message: "Driver ID and amount required" });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    const txn = await DriverWallet.create({
      driverId: mongoose.Types.ObjectId(driverId),
      amount: Number(amount),
      reason: remark || "Reward Added",
      addedBy,
      status: "pending",
    });

    return res.json({ success: true, message: "Reward created (pending)", txn });
  } catch (err) {
    console.error("createReward:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* -------------------------------------------------------------------------- */
/* 🟢 Driver: View Wallet (Approved Rewards) */
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

    const total = txns.reduce((sum, item) => sum + (item.amount || 0), 0);

    return res.json({ success: true, total, walletItems: txns });
  } catch (err) {
    console.error("listDriverWallet:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* -------------------------------------------------------------------------- */
/* 🟡 Admin: List Pending Rewards */
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
/* 🟢 Admin: Approve or Reject Reward */
/* -------------------------------------------------------------------------- */
export const approveTxn = async (req, res) => {
  try {
    const { txnId } = req.params;
    const { action } = req.body; // "approve" or "reject"
    const adminId = req.user?._id;

    const txn = await DriverWallet.findById(txnId);
    if (!txn) return res.status(404).json({ message: "Reward not found" });
    if (txn.status !== "pending")
      return res.status(400).json({ message: "Reward already processed" });

    if (action === "reject") {
      txn.status = "rejected";
      txn.approvedBy = adminId;
      txn.approvedAt = new Date();
      await txn.save();
      return res.json({ success: true, message: "Reward Rejected", txn });
    }

    txn.status = "approved";
    txn.approvedBy = adminId;
    txn.approvedAt = new Date();
    await txn.save();

    return res.json({ success: true, message: "Reward Approved", txn });
  } catch (err) {
    console.error("approveTxn:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
