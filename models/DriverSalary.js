import mongoose from "mongoose";

const driverSalarySchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    required: true,
    unique: true, // Only one salary entry per driver
  },
  salaryType: {
    type: String, // fixed | commission | hourly
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  bonus: {
    type: Number,
    default: 0,
  },
  assignedDate: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("DriverSalary", driverSalarySchema);
