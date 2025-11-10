import express from "express";
import TripSheet from "../models/Tripsheet.js";
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

    const trip = await TripSheet.create({
      driverId,
      branchId,
      vehicleId,
      startKM: Number(startKm),
      startCNG: Number(startCng),
      startTime: startTime ? new Date(startTime) : new Date(),
      status: "active", // ✅ Correct Enum
    });

    await Driver.findByIdAndUpdate(driverId, { dutyStatus: true });

    res.json(trip);
  } catch (err) {
    console.error("Start duty error:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * END DUTY
 */
router.put("/end/:tripId", async (req, res) => {
  try {
    const { tripId } = req.params;
    const { endKm, endCng, endTime } = req.body;

    const trip = await TripSheet.findById(tripId);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    trip.endKM = Number(endKm);
    trip.endCNG = Number(endCng);
    trip.endTime = endTime ? new Date(endTime) : new Date();
    trip.status = "completed";

    await trip.save();
    await Driver.findByIdAndUpdate(trip.driverId, { dutyStatus: false });

    const updated = await TripSheet.findById(tripId)
      .populate("driverId", "name mobile")
      .populate("vehicleId", "vehicleNumber");

    res.json(updated);
  } catch (err) {
    console.error("End duty error:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * ACTIVE TRIP (Driver Dashboard)
 */
router.get("/active/:driverId", async (req, res) => {
  try {
    const { driverId } = req.params;

    const active = await TripSheet.findOne({
      driverId,
      status: "active",
    })
      .populate("driverId", "name mobile")
      .populate("vehicleId", "vehicleNumber rcBookUrl insuranceUrl permitUrl fitnessUrl");

    res.json(active || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * COMPLETED TRIPS (Manager View)
 */
router.get("/tripsheets/:branchId", async (req, res) => {
  try {
    const { branchId } = req.params;

    const trips = await TripSheet.find({
      branchId,
      status: "completed",
    })
      .populate("driverId", "name mobile")
      .populate("vehicleId", "vehicleNumber")
      .sort({ endTime: -1 });

    res.json(trips);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
