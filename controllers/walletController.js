import DriverWallet from "../models/DriverWallet.js";
import Driver from "../models/Driver.js";
import mongoose from "mongoose";

/* -------------------------------------------------------------------------- */
/* 🟢 MANAGER / ADMIN: ADD OR LESS TRANSACTION (Reward, Advance, Deposit, Penalty) */
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

    // ✅ Validate driver existence
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    // ✅ Always store positive amount
    const absAmount = Math.abs(Number(amount));

    // ✅ Create wallet transaction entry
    const txn = await DriverWallet.create({
      driverId: mongoose.Types.ObjectId(driverId),
      branchId,
      amount: absAmount,
      reason: reason || `${type} ${action === "less" ? "deducted" : "added"}`,
      type: type || "reward",
      action: action || "add",
      addedBy,
      status: "pending",
    });

    res.json({
      success: true,
      message: `${type || "Reward"} ${
        action === "less" ? "Deducted" : "Added"
      } (Pending Admin Approval)`,
      data: txn,
    });
  } catch (err) {
    console.error("createTransaction:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};

/* -------------------------------------------------------------------------- */
/* 🟡 ADMIN: LIST ALL PENDING TRANSACTIONS */
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
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/* -------------------------------------------------------------------------- */
/* 🟢 ADMIN: APPROVE OR REJECT TRANSACTION */
/* -------------------------------------------------------------------------- */
export const approveOrReject = async (req, res) => {
  try {
    const { txnId, action } = req.params; // approve / reject
    const adminId = req.user._id;

    const txn = await DriverWallet.findById(txnId);
    if (!txn)
      return res.status(404).json({ success: false, message: "Transaction not found" });

    if (txn.status !== "pending") {
      return res
        .status(400)
        .json({ success: false, message: "Transaction already processed" });
    }

    // ✅ Update status
    txn.status = action === "reject" ? "rejected" : "approved";
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
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/* -------------------------------------------------------------------------- */
/* 🔵 DRIVER: VIEW OWN WALLET (Approved Transactions) */
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

    // ✅ Calculate totals for add / less
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
      walletItems: txns,
    });
  } catch (err) {
    console.error("viewDriverWallet:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/* -------------------------------------------------------------------------- */
/* 🟣 ADMIN: LIST ALL APPROVED TRANSACTIONS (Grouped by Type) */
/* -------------------------------------------------------------------------- */
export const listApprovedGrouped = async (req, res) => {
  try {
    const approved = await DriverWallet.find({ status: "approved" })
      .populate("driverId", "name mobile branch")
      .populate("addedBy", "name email")
      .sort({ updatedAt: -1 });

    // ✅ Group approved entries by type
    const grouped = {
      reward: approved.filter((t) => t.type === "reward"),
      advance: approved.filter((t) => t.type === "advance"),
      deposit: approved.filter((t) => t.type === "deposit"),
      penalty: approved.filter((t) => t.type === "penalty"),
    };

    res.json({
      success: true,
      grouped,
      totalCount: approved.length,
    });
  } catch (err) {
    console.error("listApprovedGrouped:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
