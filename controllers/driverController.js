import bcrypt from "bcryptjs";
import Driver from "../models/Driver.js";

/* ------------------------------------------------------
   🟢 Register New Driver  (Cloudinary URLs auto saved)
------------------------------------------------------*/
export const registerDriver = async (req, res) => {
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
      return res.status(400).json({
        message: "Mobile number and password are required",
      });
    }

    // Check duplicate driver
    const existingDriver = await Driver.findOne({ mobile });
    if (existingDriver) {
      return res.status(400).json({ message: "Driver already registered" });
    }

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
      password: hashedPassword,

      // ⭐ Cloudinary URLs
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
    console.error("Register Driver Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ------------------------------------------------------
   🟡 Get Pending Drivers
------------------------------------------------------*/
export const getPendingDrivers = async (req, res) => {
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
    console.error("Get Pending Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ------------------------------------------------------
   🟢 Approve Driver
------------------------------------------------------*/
export const approveDriver = async (req, res) => {
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
};

/* ------------------------------------------------------
   🔴 Reject Driver
------------------------------------------------------*/
export const rejectDriver = async (req, res) => {
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
};

/* ------------------------------------------------------
   🟢 Get Approved Drivers
------------------------------------------------------*/
export const getApprovedDrivers = async (req, res) => {
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
    console.error("Approved Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
