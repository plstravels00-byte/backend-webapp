import express from "express";
import multer from "multer";
import bcrypt from "bcryptjs";
import Driver from "../models/Driver.js";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ----------------------------
   📂 Multer: File Upload Setup
-----------------------------*/
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

/* ----------------------------
   🟢 Register New Driver (Public)
-----------------------------*/
router.post(
  "/register",
  upload.fields([
    { name: "aadharFront", maxCount: 1 },
    { name: "aadharBack", maxCount: 1 },
    { name: "dlFront", maxCount: 1 },
    { name: "dlBack", maxCount: 1 },
    { name: "panUpload", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        mobile,
        refNumber,
        refNumber2,
        aadharNumber,
        dlNumber,
        panNumber,
        address,
        branch,
        email,
        password,
      } = req.body;

      if (!mobile || !password) {
        return res
          .status(400)
          .json({ message: "Mobile number and password are required" });
      }

      const existingDriver = await Driver.findOne({ mobile });
      if (existingDriver) {
        return res.status(400).json({ message: "Driver already registered" });
      }

      // ✅ Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const driver = new Driver({
        name: firstName,
        lastName,
        mobile,
        refNumber,
        refNumber2,
        aadharNumber,
        dlNumber,
        panNumber,
        address,
        branch,
        email,
        password: hashedPassword, // 👈 save hashed password
        aadharFrontUrl: req.files["aadharFront"]?.[0]?.path,
        aadharBackUrl: req.files["aadharBack"]?.[0]?.path,
        dlFrontUrl: req.files["dlFront"]?.[0]?.path,
        dlBackUrl: req.files["dlBack"]?.[0]?.path,
        panUrl: req.files["panUpload"]?.[0]?.path,
        selfieUrl: req.files["selfie"]?.[0]?.path,
        isApproved: false,
        status: "waiting",
      });

      await driver.save();

      res.status(201).json({
        message: "Driver registration submitted for approval",
        driver,
      });
    } catch (err) {
      console.error("Driver Registration Error:", err);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

/* ----------------------------
   🟡 Get Pending Drivers
-----------------------------*/
router.get(
  "/pending",
  verifyToken,
  allowRoles("admin", "manager"),
  async (req, res) => {
    try {
      const filter =
        req.user.role === "manager"
          ? { branch: req.user.branch, isApproved: false }
          : { isApproved: false };

      const pendingDrivers = await Driver.find(filter).populate("branch", "name");

      const formattedDrivers = pendingDrivers.map((d) => ({
        ...d._doc,
        aadharUrl: d.aadharFrontUrl || d.aadharBackUrl,
        dlUrl: d.dlFrontUrl || d.dlBackUrl,
      }));

      res.json(formattedDrivers);
    } catch (err) {
      console.error("Get Pending Drivers Error:", err);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

/* ----------------------------
   🟢 Approve Driver
-----------------------------*/
router.patch(
  "/:id/approve",
  verifyToken,
  allowRoles("admin", "manager"),
  async (req, res) => {
    try {
      const driver = await Driver.findById(req.params.id);
      if (!driver) return res.status(404).json({ message: "Driver not found" });

      if (
        req.user.role === "manager" &&
        driver.branch?.toString() !== req.user.branch?.toString()
      ) {
        return res
          .status(403)
          .json({ message: "You can only approve drivers from your branch" });
      }

      driver.isApproved = true;
      driver.status = "active";
      await driver.save();
      res.json({ message: "Driver approved successfully", driver });
    } catch (err) {
      console.error("Approve Driver Error:", err);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

/* ----------------------------
   🔴 Reject Driver
-----------------------------*/
router.delete(
  "/:id/reject",
  verifyToken,
  allowRoles("admin", "manager"),
  async (req, res) => {
    try {
      const driver = await Driver.findById(req.params.id);
      if (!driver) return res.status(404).json({ message: "Driver not found" });

      if (
        req.user.role === "manager" &&
        driver.branch?.toString() !== req.user.branch?.toString()
      ) {
        return res
          .status(403)
          .json({ message: "You can only reject drivers from your branch" });
      }

      await driver.deleteOne();
      res.json({ message: "Driver rejected and removed" });
    } catch (err) {
      console.error("Reject Driver Error:", err);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

/* ----------------------------
   🟢 Get Approved Drivers
-----------------------------*/
router.get(
  "/approved",
  verifyToken,
  allowRoles("admin", "manager"),
  async (req, res) => {
    try {
      const filter =
        req.user.role === "manager"
          ? { branch: req.user.branch, isApproved: true }
          : { isApproved: true };

      const drivers = await Driver.find(filter).populate("branch", "name");

      const formattedDrivers = drivers.map((d) => ({
        ...d._doc,
        aadharUrl: d.aadharFrontUrl || d.aadharBackUrl,
        dlUrl: d.dlFrontUrl || d.dlBackUrl,
      }));

      res.json(formattedDrivers);
    } catch (err) {
      console.error("Get Approved Drivers Error:", err);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

export default router;
