import express from "express";
import DriverWallet from "../models/DriverWallet.js";
import Driver from "../models/Driver.js";

const router = express.Router();

/**
 * 🟢 Manager adds reward for driver (pending)
 */
router.post("/add", async (req, res) => {
  try {
    const { driverId, branchId, amount, reason, addedBy } = req.body;

    // Validate driver
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
      message: "Reward Added (Pending Approval)",
      data: reward,
    });
  } catch (err) {
    console.error("Error adding reward:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/**
 * 🟢 Admin approves reward
 */
router.put("/approve/:id", async (req, res) => {
  try {
    const adminId = req.body.adminId || null;

    const updated = await DriverWallet.findByIdAndUpdate(
      req.params.id,
      { status: "approved", approvedBy: adminId, approvedAt: new Date() },
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
 * 🔴 Admin rejects reward
 */
router.delete("/reject/:id", async (req, res) => {
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
 * 🔵 Get wallet for specific driver (only approved)
 */
router.get("/driver/:driverId", async (req, res) => {
  try {
    const rewards = await DriverWallet.find({
      driverId: req.params.driverId,
      status: "approved",
    }).sort({ createdAt: -1 });

    const total = rewards.reduce((sum, item) => sum + item.amount, 0);

    res.json({ success: true, total, walletItems: rewards });
  } catch (err) {
    console.error("Error fetching wallet:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/**
 * 🔵 Admin - List Pending + Approved rewards
 */
router.get("/pending", async (req, res) => {
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

export default router;
