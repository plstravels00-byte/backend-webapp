import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    lastName: { type: String },
    mobile: { type: String, required: true, unique: true },
    email: { type: String },
    password: { type: String }, // optional - for login if needed later

    refNumber: { type: String },
    refNumber2: { type: String },

    aadharNumber: { type: String },
    dlNumber: { type: String },
    panNumber: { type: String },
    address: { type: String },

    /* 📸 Uploaded Document URLs */
    selfieUrl: { type: String },
    aadharFrontUrl: { type: String },
    aadharBackUrl: { type: String },
    dlFrontUrl: { type: String },
    dlBackUrl: { type: String },
    panUrl: { type: String },

    /* 🏢 Branch assignment */
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: false,
    },

    /* 👨‍💼 Manager who created/handles this driver */
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    /* ✅ Approval & Status fields */
    isApproved: {
      type: Boolean,
      default: false, // stays false until approved
    },
    status: {
      type: String,
      enum: ["waiting", "active", "rejected"],
      default: "waiting", // waiting until approved
    },
  },
  { timestamps: true }
);

export default mongoose.model("Driver", driverSchema);
