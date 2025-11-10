import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  lat: Number,
  lng: Number,
  address: String
}, { _id: false });

const tripSheetSchema = new mongoose.Schema(
  {
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },

    vehicleNumber: String,

    startKM: Number,
    endKM: Number,

    startCNG: Number,
    endCNG: Number,

    startTime: Date,
    endTime: Date,

    startLoc: locationSchema,
    endLoc: locationSchema,

    status: { type: String, enum: ["active", "completed"], default: "active" }
  },
  { timestamps: true }
);

export default mongoose.model("TripSheet", tripSheetSchema);
