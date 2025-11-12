// server/controllers/walletController.js
import { WalletTxn, WalletBalance } from "../models/Wallet.js";
import Driver from "../models/Driver.js";
import mongoose from "mongoose";

export const createReward = async (req, res) => {
  try {
    const { driverId, amount, remark } = req.body;
    const addedBy = req.user?._id; // assuming verifyToken sets req.user

    if (!driverId || !amount) return res.status(400).json({ message: "driverId and amount required" });

    // optional: check driver exists
    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    const txn = await WalletTxn.create({
      driverId: mongoose.Types.ObjectId(driverId),
      amount: Number(amount),
      remark,
      addedBy
    });

    return res.json({ message: "Reward created (pending)", txn });
  } catch (err) {
    console.error("createReward:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const listDriverWallet = async (req, res) => {
  try {
    const { driverId } = req.params;
    // balance
    const balDoc = await WalletBalance.findOne({ driverId });
    const balance = balDoc ? balDoc.balance : 0;

    // recent txns (approved + pending)
    const txns = await WalletTxn.find({ driverId }).sort({ createdAt: -1 }).limit(50);

    return res.json({ balance, txns });
  } catch (err) {
    console.error("listDriverWallet:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Admin: list pending txns
export const listPending = async (req, res) => {
  try {
    const pending = await WalletTxn.find({ status: "pending" })
      .populate("driverId", "name mobile")
      .populate("addedBy", "name email")
      .sort({ createdAt: -1 });
    return res.json(pending);
  } catch (err) {
    console.error("listPending:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Admin approve/reject
export const approveTxn = async (req, res) => {
  try {
    const { txnId } = req.params;
    const { action } = req.body; // "approve" or "reject"
    const adminId = req.user?._id;

    const txn = await WalletTxn.findById(txnId);
    if (!txn) return res.status(404).json({ message: "Txn not found" });
    if (txn.status !== "pending") return res.status(400).json({ message: "Txn not pending" });

    if (action === "reject") {
      txn.status = "rejected";
      txn.approvedBy = adminId;
      txn.approvedAt = new Date();
      await txn.save();
      return res.json({ message: "Rejected", txn });
    }

    // approve
    txn.status = "approved";
    txn.approvedBy = adminId;
    txn.approvedAt = new Date();
    await txn.save();

    // update balance
    const bal = await WalletBalance.findOneAndUpdate(
      { driverId: txn.driverId },
      { $inc: { balance: txn.amount } },
      { upsert: true, new: true }
    );

    return res.json({ message: "Approved and balance updated", txn, balance: bal.balance });
  } catch (err) {
    console.error("approveTxn:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
