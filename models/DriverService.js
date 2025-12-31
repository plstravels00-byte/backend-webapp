import mongoose from "mongoose";

const DriverServiceSchema = new mongoose.Schema(
  {
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    serviceDate: { type: Date, required: true },
    serviceCenter: { type: String },
    description: { type: String },
    cost: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const DriverService = mongoose.model("DriverService", DriverServiceSchema);

export default DriverService;
