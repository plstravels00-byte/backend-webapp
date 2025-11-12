// server/models/Wallet.js
import mongoose from "mongoose";

const walletTxnSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // manager/admin who created
  remark: { type: String },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  approvedAt: { type: Date, default: null },
}, { timestamps: true });

const walletBalanceSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true, unique: true },
  balance: { type: Number, default: 0 },
}, { timestamps: true });

export const WalletTxn = mongoose.models.WalletTxn || mongoose.model("WalletTxn", walletTxnSchema);
export const WalletBalance = mongoose.models.WalletBalance || mongoose.model("WalletBalance", walletBalanceSchema);
