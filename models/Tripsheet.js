import mongoose from "mongoose";

const tripSheetSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    // ✅ Add this field (this is what was missing)
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },

    startKm: { type: Number, required: true },
    startCng: { type: Number, required: true },

    endKm: { type: Number, default: null },
    endCng: { type: Number, default: null },

    startTime: { type: Date, default: Date.now },
    endTime: { type: Date, default: null },

    status: {
      type: String,
      enum: ["ongoing", "completed"],
      default: "ongoing",
    },
  },
  { timestamps: true }
);

// ✅ Keep correct collection name
export default mongoose.model("Trip", tripSheetSchema, "tripsheet");
