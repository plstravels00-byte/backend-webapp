import mongoose from "mongoose";
import dotenv from "dotenv";
import SalaryScheme from "../models/SalaryScheme.js";
dotenv.config();

(async ()=>{
  await mongoose.connect(process.env.MONGO_URI);
  await SalaryScheme.deleteMany({});
  await SalaryScheme.insertMany([
    { name:"Daily Salary",   frequency:"daily",  target:4500,  incentiveBelow:30, incentiveAbove:60, operatorCommissionPercent:10, cngAllowancePercent:30, extraRule:"daily_15_pickups_300", notes:"30% upto 4500; 60% above; +₹300 if 15 pickups" },
    { name:"Weekly Salary",  frequency:"weekly", target:21000, incentiveBelow:30, incentiveAbove:60, operatorCommissionPercent:10, cngAllowancePercent:30, notes:"Weekly 21k target" },
    { name:"Monthly Salary", frequency:"monthly",target:90000, incentiveBelow:30, incentiveAbove:60, operatorCommissionPercent:10, cngAllowancePercent:30, notes:"Monthly 90k target" },
    { name:"12H Shift",      frequency:"12hr",   target:2500,  incentiveBelow:30, incentiveAbove:60, operatorCommissionPercent:10, cngAllowancePercent:30, notes:"Half day 12hrs" },
    { name:"Car Rental 1600",frequency:"rental", target:1600,  incentiveBelow:0,  incentiveAbove:0,  operatorCommissionPercent:10, cngAllowancePercent:30, notes:"24H rental 1600" },
    { name:"Car Rental 1700",frequency:"rental", target:1700,  incentiveBelow:0,  incentiveAbove:0,  operatorCommissionPercent:10, cngAllowancePercent:30, notes:"24H rental 1700" },
  ]);
  console.log("Seeded ✅"); process.exit(0);
})().catch(e=>{console.error(e); process.exit(1);});
