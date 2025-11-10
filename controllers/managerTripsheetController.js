import TripSheet from "../models/tripSheet.js";

export const startDuty = async (req, res) => {
  const driverId = req.user.id;
  const { vehicleId, vehicleNumber, startKM, startCNG, lat, lng, address } = req.body;

  const active = await TripSheet.findOne({ driverId, status: "active" });
  if (active) return res.status(400).json({ message: "Already on duty" });

  const trip = await TripSheet.create({
    driverId,
    vehicleId,
    vehicleNumber,
    startKM,
    startCNG,
    startTime: new Date(),
    startLoc: { lat, lng, address }
  });

  res.json({ success: true, trip });
};

export const endDuty = async (req, res) => {
  const driverId = req.user.id;
  const { endKM, endCNG, lat, lng, address } = req.body;

  const trip = await TripSheet.findOne({ driverId, status: "active" });
  if (!trip) return res.status(404).json({ message: "No active duty" });

  trip.endKM = endKM;
  trip.endCNG = endCNG;
  trip.endTime = new Date();
  trip.endLoc = { lat, lng, address };
  trip.status = "completed";

  await trip.save();
  res.json({ success: true, trip });
};
