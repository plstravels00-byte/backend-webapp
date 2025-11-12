import mongoose from "mongoose";

const driverWalletSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver", // ✅ make sure this points to your Driver model, not User
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
      trim: true,
      default: "",
    },

    /* -------------------------------------------------------------------------- */
    /* 🟢 NEW FIELD: Transaction Type                                              */
    /* -------------------------------------------------------------------------- */
    type: {
      type: String,
      enum: ["reward", "advance", "deposit", "penalty"],
      default: "reward",
    },

    /* -------------------------------------------------------------------------- */
    /* 🔵 Status Control                                                          */
    /* -------------------------------------------------------------------------- */
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    /* -------------------------------------------------------------------------- */
    /* 🟣 Who Added & Who Approved                                                */
    /* -------------------------------------------------------------------------- */
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Manager who added
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin who approved
    },
    approvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

/* -------------------------------------------------------------------------- */
/* 🧮 VIRTUALS / HELPERS                                                      */
/* -------------------------------------------------------------------------- */

// Quick boolean check
driverWalletSchema.virtual("isApproved").get(function () {
  return this.status === "approved";
});

// Optional computed display label
driverWalletSchema.virtual("displayLabel").get(function () {
  return `${this.type.toUpperCase()} — ₹${this.amount} (${this.status})`;
});

/* -------------------------------------------------------------------------- */
/* ✅ EXPORT MODEL                                                             */
/* -------------------------------------------------------------------------- */
export default mongoose.model("DriverWallet", driverWalletSchema);
