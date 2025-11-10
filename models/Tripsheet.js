/**
 * START DUTY
 */
router.post("/start", async (req, res) => {
  try {
    const { driverId, branchId, vehicleId, startKm, startCng, startTime } = req.body;

    const trip = await Trip.create({
      driverId,
      branchId,
      vehicleId,
      startKM: startKm,
      startCNG: startCng,
      startTime: startTime ? new Date(startTime) : new Date(),
      status: "active", // ✅ corrected
    });

    await Driver.findByIdAndUpdate(driverId, { dutyStatus: true });

    return res.json(trip);
  } catch (err) {
    return res.status(500).json({ message: err.message });
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
    trip.status = "completed"; // ✅ correct

    await trip.save();

    await Driver.findByIdAndUpdate(trip.driverId, { dutyStatus: false });

    return res.json(trip);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/**
 * GET ACTIVE TRIP
 */
router.get("/active/:driverId", async (req, res) => {
  try {
    const { driverId } = req.params;

    const activeTrip = await Trip.findOne({
      driverId,
      status: "active", // ✅ corrected
    });

    return res.json(activeTrip || null);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

