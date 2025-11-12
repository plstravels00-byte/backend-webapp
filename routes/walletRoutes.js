import express from "express";
import DriverWallet from "../models/DriverWallet.js";
import Driver from "../models/Driver.js";

const router = express.Router();

/**
 * 🧾 MANAGER adds reward
 */
router.post("/add", async (req, res) => {
  try {
    const { driverId, branchId, amount, reason, addedBy } = req.body;

    const reward = await DriverWallet.create({
      driverId,
      branchId,
      amount,
      reason,
      addedBy,
    });

    res.json({ success: true, reward });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 🧾 ADMIN approves or rejects reward
 */
router.put("/approve/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const reward = await DriverWallet.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    // ✅ If approved, add amount to driver's walletBalance field
    if (status === "approved") {
      await Driver.findByIdAndUpdate(reward.driverId, {
        $inc: { walletBalance: reward.amount },
      });
    }

    res.json({ success: true, reward });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 🧾 DRIVER - get wallet transactions + balance
 */
router.get("/driver/:driverId", async (req, res) => {
  try {
    const { driverId } = req.params;

    const walletItems = await DriverWallet.find({ driverId, status: "approved" }).sort({ createdAt: -1 });

    const total = walletItems.reduce((sum, item) => sum + item.amount, 0);

    res.json({ success: true, total, walletItems });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
