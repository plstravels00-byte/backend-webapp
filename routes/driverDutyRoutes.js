import express from "express";
import mongoose from "mongoose";
import Driver from "../models/Driver.js";

const TripSheet = mongoose.model("TripSheet");
const router = express.Router();

/** START DUTY */
router.post("/start", async (req, res) => {
  try {
    const { driverId, branchId, vehicleId, startKm, startCng, startTime } = req.body;

    const trip = await TripSheet.create({
      driverId,
      branchId,
      vehicleId,
      startKM: Number(startKm),
      startCNG: Number(startCng),
      startTime: startTime ? new Date(startTime) : new Date(),
      status: "active",
    });

    await Driver.findByIdAndUpdate(driverId, { dutyStatus: true });
    return res.json(trip);
  } catch (err) {
    console.error("Start duty error:", err);
    return res.status(500).json({ message: err.message });
  }
});

/** END DUTY */
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

    return res.json(trip);
  } catch (err) {
    console.error("End duty error:", err);
    return res.status(500).json({ message: err.message });
  }
});

/** ACTIVE TRIP */
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

/** COMPLETED TRIPS */
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
