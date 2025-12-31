import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    place: { type: String },
    date: { type: String, required: true }, // follow-up date YYYY-MM-DD
    description: { type: String },
    status: { type: String, default: "Pending" }, // Pending / Called / NR
    completed: { type: Boolean, default: false }, // For follow-up
  },
  { timestamps: true }
);

export default mongoose.model("Lead", leadSchema);
