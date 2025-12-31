import mongoose from "mongoose";

const maintenanceSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    problemType: String,
    description: String,
    status: {
      type: String,
      default: "Open",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Maintenance", maintenanceSchema);
