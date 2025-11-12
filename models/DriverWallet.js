import mongoose from "mongoose";

const driverWalletSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    required: true,
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
  },
  amount: {
    type: Number,
    required: true,
    default: 0,
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Manager or Admin
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("DriverWallet", driverWalletSchema);
