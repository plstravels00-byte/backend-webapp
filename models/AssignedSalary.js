import mongoose from "mongoose";

const AssignedSalarySchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },
    schemeId: { // ✅ Correct reference field
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalaryScheme",
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
  },
  { timestamps: true }
);

const AssignedSalary = mongoose.model("AssignedSalary", AssignedSalarySchema);

export default AssignedSalary;
