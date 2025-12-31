import mongoose from "mongoose";

const LeadSchema = new mongoose.Schema(
  {
    name: String,
    mobile: String,
    place: String,
    date: String,
    description: String,
    completed: {
      type: Boolean,
      default: false,
    },
    branch: {
      type: String,
      required: false,
    }
  },
  { timestamps: true }
);

export default mongoose.model("Lead", LeadSchema);
