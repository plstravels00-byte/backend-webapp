import express from "express";
import Trip from "../models/Tripsheet.js";
import Driver from "../models/Driver.js";

const router = express.Router();

/**
 * START DUTY
 */
router.post("/start", async (req, res) => {
  try {
    const { driverId, branchId, vehicleId, startKm, startCng, startTime } = req.body;

    if (!driverId || !branchId || !vehicleId || startKm == null || startCng == null) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const trip = await Trip.create({
      driverId,
      branchId,
      vehicleId,
      startKM: Number(startKm),
      startCNG: Number(startCng),
      startTime: startTime ? new Date(startTime) : new Date(),
      status: "active", // ✅ must match schema
    });

    await Driver.findByIdAndUpdate(driverId, { dutyStatus: true });

    return res.json(trip);
  } catch (err) {
    console.error("Start duty error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * END DUTY
 */
router.put("/end/:tripId", async (req, res) => {
  try {
    const { tripId } = req.params;
    const { endKm, endCng, endTime } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    trip.endKM = Number(endKm);
    trip.endCNG = Number(endCng);
    trip.endTime = endTime ? new Date(endTime) : new Date();
    trip.status = "completed"; // ✅ matches schema

    await trip.save();

    await Driver.findByIdAndUpdate(trip.driverId, { dutyStatus: false });

    const updatedTrip = await Trip.findById(tripId)
      .populate("vehicleId", "vehicleNumber")
      .populate("driverId", "name mobile");

    return res.json(updatedTrip);
  } catch (err) {
    console.error("End duty error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET ACTIVE TRIP (Driver Dashboard)
 */
router.get("/active/:driverId", async (req, res) => {
  try {
    const { driverId } = req.params;

    const activeTrip = await Trip.findOne({
      driverId,
      status: "active", // ✅ must match schema
      vehicleId: { $exists: true, $ne: null },
    })
      .populate("vehicleId", "vehicleNumber rcBookUrl insuranceUrl permitUrl fitnessUrl")
      .populate("driverId", "name mobile");

    return res.json(activeTrip || null);
  } catch (err) {
    console.error("Active Duty Check Error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET COMPLETED TRIPS (Manager View)
 */
router.get("/tripsheets/:branchId", async (req, res) => {
  try {
    const { branchId } = req.params;

    const trips = await Trip.find({
      branchId,
      status: "completed",
      vehicleId: { $exists: true, $ne: null },
    })
      .populate("driverId", "name mobile")
      .populate("vehicleId", "vehicleNumber")
      .sort({ endTime: -1 });

    return res.json(trips);
  } catch (err) {
    console.error("Get tripsheets error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
