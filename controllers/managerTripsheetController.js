import TripSheet from "../models/Tripsheet.js";
import mongoose from "mongoose";

// ✅ Manager / Admin view completed duty trip sheets
export const getCompletedTripsByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;

    // Handle ObjectId or string
    const query = mongoose.isValidObjectId(branchId)
      ? { branchId: new mongoose.Types.ObjectId(branchId), status: "completed" }
      : { branchId, status: "completed" };

    const trips = await TripSheet.find(query)
      .populate("driverId", "name mobile")
      .populate("vehicleId", "vehicleNumber model")
      .sort({ updatedAt: -1 });

    if (!trips.length) {
      return res.status(404).json({ message: "No completed trips found" });
    }

    res.json(trips);

  } catch (err) {
    console.error("❌ Error in getCompletedTripsByBranch:", err);
    res.status(500).json({ message: "Server error" });
  }
};
