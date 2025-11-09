import mongoose from "mongoose";

const carSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: true,
      unique: true,
    },
    brand: String,
    model: String,
    fuelType: String,

    // ✅ Branch mapping (VERY IMPORTANT)
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    // ✅ Uploaded Document URLs
    rcBookUrl: String,
    insuranceUrl: String,
    permitUrl: String,
    fitnessUrl: String,

    // ✅ Expiry Dates
    insuranceExpiry: Date,
    permitExpiry: Date,
    fitnessExpiry: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Car", carSchema);
