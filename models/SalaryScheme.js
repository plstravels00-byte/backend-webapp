// server/models/SalaryScheme.js
import mongoose from "mongoose";

const SalarySchemeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "12hr", "rental"],
      required: true,
    },
    target: { type: Number },
    incentiveBelow: { type: Number, default: 30 },
    incentiveAbove: { type: Number, default: 60 },
    operatorCommissionPercent: { type: Number, default: 10 },
    cngAllowancePercent: { type: Number, default: 30 },
    extraRule: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("SalaryScheme", SalarySchemeSchema);
