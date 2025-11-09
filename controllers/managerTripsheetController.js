// controllers/managerTripsheetController.js
import TripSheet from "../models/Tripsheet.js"; // ✅ using your existing model name

export const getManagerTripsheet = async (req, res) => {
  try {
    const { branchId } = req.params;

    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is required" });
    }

    // ✅ Find completed trips for that branch
    const trips = await TripSheet.find({ branchId, status: "completed" })
      .populate("driverId", "name mobile email")
      .sort({ updatedAt: -1 });

    if (!trips || trips.length === 0) {
      return res.status(200).json({ message: "No completed trips found" });
    }

    res.status(200).json(trips);
  } catch (error) {
    console.error("Error fetching trips:", error);
    res.status(500).json({ message: "Server error fetching trips" });
  }
};
