import mongoose from "mongoose";

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  manager: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: false, // ✅ Not required now
    default: null,   // ✅ Prevents validation errors
  },
  isHeld: { type: Boolean, default: false },
});

export default mongoose.model("Branch", branchSchema);
