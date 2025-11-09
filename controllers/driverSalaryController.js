// controllers/driverSalaryController.js
const Driver = require('../models/Driver');
const SalaryScheme = require('../models/SalaryScheme');
const AssignedSalary = require('../models/AssignedSalary');

/**
 * Get driver visible scheme (DO NOT return targetAmount)
 */
exports.getDriverScheme = async (req, res) => {
  try {
    const driverId = req.params.driverId;
    // ensure driver or driver-token; for admin/manager you may fetch any driver
    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    if (!driver.salaryScheme) return res.json({ message: 'No scheme assigned' });

    const scheme = await SalaryScheme.findById(driver.salaryScheme).select('name schemeType amount description code');
    return res.json({ scheme });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * This function should be called when a trip completes.
 * Example usage inside your trips controller after saving trip:
 *   await updateDriverSalaryOnTrip(tripDoc);
 */
exports.updateDriverSalaryOnTrip = async (trip) => {
  try {
    // trip should contain driverId, durationHours, distanceKm, fare, branchId, tripDate, etc.
    const DriverModel = require('../models/Driver');
    const driver = await DriverModel.findById(trip.driverId);
    if (!driver) return;

    if (!driver.salaryScheme) {
      // no base scheme assigned -> maybe pay per-trip; skip
      return;
    }

    const scheme = await SalaryScheme.findById(driver.salaryScheme);
    if (!scheme) return;

    // Basic sample logic: customize for your real rules
    let earned = 0;
    switch (scheme.schemeType) {
      case 'daily':
        // fixed daily amount: pay on each day trip happens (only once per day ideally)
        earned = scheme.amount;
        break;
      case 'monthly':
        // monthly pro-rata: amount / 30 per day (or custom)
        // here we add per-trip small portion: (amount / 30) * (trip.durationHours / 8) or just fixed fraction
        earned = (scheme.amount / 30) * ( (trip.durationHours && trip.durationHours>0) ? Math.min(trip.durationHours,24)/8 : 1 );
        break;
      case 'weekly':
        earned = scheme.amount / 7; // per day fraction
        break;
      case '12hr':
      case '12hr-alt':
        // if driver worked a 12 hour shift: pay scheme.amount when shift done. Per trip, we can pro-rate by hours.
        earned = (trip.durationHours) ? (scheme.amount * (trip.durationHours/12)) : 0;
        break;
      case 'rental':
        // rental may be per day: assume scheme.amount per day
        earned = scheme.amount * ( (trip.days) ? trip.days : 1 );
        break;
      default:
        // fallback: use per-trip fare percentage or fixed
        earned = trip.fare ? trip.fare * 0.6 : 0; // example: driver gets 60% of fare
    }

    // Round and ensure not negative
    earned = Math.max(0, Math.round(earned * 100) / 100);

    // Update driver's salary summary
    driver.salarySummary = driver.salarySummary || { earned: 0 };
    driver.salarySummary.earned = (driver.salarySummary.earned || 0) + earned;
    driver.salarySummary.lastUpdated = new Date();
    await driver.save();

    // Optionally write an entry somewhere (driverSalary collection) for history
    const DriverSalary = require('../models/DriverSalary'); // create model if you want history
    if (DriverSalary) {
      await DriverSalary.create({
        driverId: driver._id,
        tripId: trip._id,
        schemeId: scheme._id,
        amountEarned: earned,
        meta: { fare: trip.fare, durationHours: trip.durationHours }
      });
    }

    return { success: true, earned };
  } catch (err) {
    console.error('updateDriverSalaryOnTrip error:', err);
    return { success: false, error: err.message };
  }
};
