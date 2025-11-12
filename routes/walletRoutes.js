import express from "express";
import DriverWallet from "../models/DriverWallet.js";

const router = express.Router();

/**
 * 🟢 Manager adds reward for driver
 */
router.post("/add", async (req, res) => {
  try {
    const { driverId, branchId, amount, reason, addedBy } = req.body;
    const newReward = await DriverWallet.create({
      driverId,
      branchId,
      amount,
      reason,
      addedBy,
      status: "pending",
    });
    res.json({ success: true, message: "Reward Added (Pending Approval)", data: newReward });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/**
 * 🟢 Admin approves reward
 */
router.put("/approve/:id", async (req, res) => {
  try {
    const updated = await DriverWallet.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );
    res.json({ success: true, message: "Reward Approved", data: updated });
  } catch (err) {
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

    const total = rewards.reduce((acc, item) => acc + item.amount, 0);
    res.json({ success: true, total, walletItems: rewards });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

export default router;
