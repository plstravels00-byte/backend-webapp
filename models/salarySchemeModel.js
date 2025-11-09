import mongoose from "mongoose";

const salarySchemeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch", // ✅ Branch model oda name
      default: null,
    },
    htmlContent: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("SalaryScheme", salarySchemeSchema);
