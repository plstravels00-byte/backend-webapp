import express from "express";
import DriverWallet from "../models/DriverWallet.js";
import Driver from "../models/Driver.js";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * 🟢 MANAGER adds reward (pending)
 */
router.post("/add", verifyToken, allowRoles("manager"), async (req, res) => {
  try {
    const { driverId, branchId, amount, reason } = req.body;
    const addedBy = req.user._id;

    const driver = await Driver.findById(driverId);
    if (!driver)
      return res.status(404).json({ success: false, message: "Driver not found" });

    const reward = await DriverWallet.create({
      driverId,
      branchId,
      amount,
      reason,
      addedBy,
      status: "pending",
    });

    res.json({
      success: true,
      message: "Reward Added (Pending Admin Approval)",
      data: reward,
    });
  } catch (err) {
    console.error("Error adding reward:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/**
 * 🟣 ADMIN approves reward
 */
router.put("/approve/:id", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const updated = await DriverWallet.findByIdAndUpdate(
      req.params.id,
      { status: "approved", approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ success: false, message: "Reward not found" });

    res.json({ success: true, message: "Reward Approved", data: updated });
  } catch (err) {
    console.error("Error approving reward:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/**
 * 🔴 ADMIN rejects reward
 */
router.delete("/reject/:id", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const deleted = await DriverWallet.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ success: false, message: "Reward not found" });

    res.json({ success: true, message: "Reward Rejected", data: deleted });
  } catch (err) {
    console.error("Error rejecting reward:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/**
 * 🔵 Admin - View all (pending + approved)
 */
router.get("/pending", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const pending = await DriverWallet.find({ status: "pending" })
      .populate("driverId", "name mobile")
      .populate("addedBy", "name")
      .sort({ createdAt: -1 });

    const approved = await DriverWallet.find({ status: "approved" })
      .populate("driverId", "name mobile")
      .populate("addedBy", "name")
      .sort({ updatedAt: -1 });

    res.json({ success: true, pending, approved });
  } catch (err) {
    console.error("Error listing rewards:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});
