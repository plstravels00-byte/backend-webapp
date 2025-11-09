import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    vehicleNumber: { type: String, required: true, unique: true },
    model: { type: String, required: true },

    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    // Optional Documents
    rcBookUrl: { type: String, default: null },
    insuranceUrl: { type: String, default: null },
    permitUrl: { type: String, default: null },
    fitnessUrl: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Vehicle", vehicleSchema);
