// controllers/vehicleController.js
import Vehicle from "../models/Vehicle.js";

const vehicleCtrl = {
  addVehicle: async (req, res) => {
    try {
      const { vehicleNumber, model, branchId } = req.body;

      const newVehicle = new Vehicle({
        vehicleNumber,
        model,
        branchId,
        rcBookUrl: req.files?.rcBook?.[0]?.path,
        insuranceUrl: req.files?.insurance?.[0]?.path,
        permitUrl: req.files?.permit?.[0]?.path,
        fitnessUrl: req.files?.fitness?.[0]?.path,
      });

      await newVehicle.save();
      res.json({ message: "✅ Vehicle Added Successfully" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // ✅ FIXED HERE (params instead of query)
  getByBranch: async (req, res) => {
    try {
      const { branchId } = req.params; // ← FIXED

      const data = await Vehicle.find({ branchId }).populate("branchId");
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};

export default vehicleCtrl;
