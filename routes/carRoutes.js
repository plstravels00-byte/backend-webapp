import express from "express";
import multer from "multer";
import Car from "../models/carModel.js";

const router = express.Router();
const upload = multer({ dest: "uploads/vehicles/" });

// ✅ Create Vehicle (Admin)
router.post(
  "/create",
  upload.fields([
    { name: "rcBook", maxCount: 1 },
    { name: "insurance", maxCount: 1 },
    { name: "permit", maxCount: 1 },
    { name: "fitness", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const files = req.files;

      const newCar = await Car.create({
        ...req.body,
        rcBookUrl: files?.rcBook?.[0]?.path,
        insuranceUrl: files?.insurance?.[0]?.path,
        permitUrl: files?.permit?.[0]?.path,
        fitnessUrl: files?.fitness?.[0]?.path,
      });

      res.json({ success: true, message: "Vehicle Added", car: newCar });
    } catch (err) {
      console.log(err);
      res.status(500).json({ success: false, message: "Error adding vehicle" });
    }
  }
);

export default router;
