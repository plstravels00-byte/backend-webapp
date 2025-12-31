import TripSheet from "../models/Tripsheet.js";
import mongoose from "mongoose";

// ✅ Manager / Admin view completed duty trip sheets
export const getCompletedTripsByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;

    // Ensure ObjectId type
    const query = {
      branchId: mongoose.Types.ObjectId.isValid(branchId)
        ? new mongoose.Types.ObjectId(branchId)
        : branchId,
      status: "completed",
    };

    const trips = await TripSheet.find(query)
      .populate("driverId", "name mobile")
      .populate("vehicleId", "vehicleNumber model")
      .sort({ updatedAt: -1 });

    // ⭐ FIX: ALWAYS RETURN ARRAY (never send 404)
    return res.json(trips);

  } catch (err) {
    console.error("❌ Error in getCompletedTripsByBranch:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
