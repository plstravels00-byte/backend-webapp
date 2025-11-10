import mongoose from "mongoose";

const salarySchemeSchema = new mongoose.Schema({
  name: String,
  tripSheetType: String,
  payBasis: String,

  target: Number,
  basicSalary: Number,
  rentalPerDay: Number,

  incentiveBelow: Number,
  incentiveAbove: Number,
  operatorCommissionPercent: Number,
  cngAllowancePercent: Number,

  notes: String,

  targetPeriodUnit: String,
  cycleType: String,

  monthAnchorDay: Number,
  monthAnchorTime: String,

  weekAnchorDow: String,
  weekAnchorTime: String,

  customDaysLength: Number,

  rentalDayStartTime: String,
  rentalDayEndTime: String,

  carryForwardTarget: Boolean,

  // ✅ NEW FIELD
  customCalcHtml: { type: String, default: "" }
});

export default mongoose.model("SalaryScheme", salarySchemeSchema);
