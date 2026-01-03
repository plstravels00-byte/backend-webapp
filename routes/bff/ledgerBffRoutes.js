import express from "express";
import Driver from "../../models/Driver.js";
import Ledger from "../../models/Ledger.js"; // adjust model name
import authMiddleware from "../../middleware/authMiddleware.js";

const router = express.Router();

/**
 * GET /api/bff/ledger/:driverId
 * FRONTEND WILL ONLY USE THIS
 */
router.get("/ledger/:driverId", authMiddleware, async (req, res) => {
  try {
    const { driverId } = req.params;

    // 1️⃣ Driver basic info
    const driver = await Driver.findById(driverId).select("name mobile");
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    // 2️⃣ Ledger transactions (salary / wallet / ledger)
    const transactions = await Ledger.find({ driver: driverId })
      .sort({ date: 1 });

    // 3️⃣ Balance calculation (SERVER SIDE)
    let balance = 0;
    const formattedTransactions = transactions.map((t) => {
      balance += t.amount;
      return {
        date: t.date,
        reason: t.reason,
        type: t.type,
        amount: t.amount,
        balance,
      };
    });

    // 4️⃣ FINAL RESPONSE (frontend friendly)
    res.json({
      driver,
      totals: {
        balance,
      },
      transactions: formattedTransactions,
    });
  } catch (error) {
    console.error("BFF LEDGER ERROR:", error);
    res.status(500).json({ message: "Ledger service failed" });
  }
});

export default router;
