import mongoose from "mongoose";

const driverDutySchema = new mongoose.Schema(
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
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },

    startKM: { type: Number, required: true },
    endKM: { type: Number, default: null },

    startCNG: { type: Number, required: true },
    endCNG: { type: Number, default: null },

    startTime: { type: Date, default: Date.now },
    endTime: { type: Date, default: null },

    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("TripSheet", driverDutySchema);
