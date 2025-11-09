import mongoose from "mongoose";

const driverSchema = new mongoose.Schema({
  // ... your schema fields ...
});

// ✅ Prevent OverwriteModelError:
export default mongoose.models.Driver || mongoose.model("Driver", driverSchema);
