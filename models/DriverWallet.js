import mongoose from "mongoose";

const driverWalletSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // driver user model
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: false,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // manager
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // admin
    },
    approvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Optional virtual for quick wallet summary
driverWalletSchema.virtual("isApproved").get(function () {
  return this.status === "approved";
});

export default mongoose.model("DriverWallet", driverWalletSchema);
