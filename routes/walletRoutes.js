import express from "express";
import DriverWallet from "../models/DriverWallet.js";
import Driver from "../models/Driver.js";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/* CLEAN AMOUNT */
const clean = (v) => Number(String(v).replace(/[^\d-]/g, "")) || 0;

/* ------------------------------------------------ */
/* ADD TRANSACTION (MANAGER / ADMIN) */
/* ------------------------------------------------ */
router.post(
  "/add",
  verifyToken,
  allowRoles("manager", "admin"),
  async (req, res) => {
    try {
      const { driverId, branchId, amount, reason, type, addedBy } = req.body;

      if (!driverId || !amount)
        return res
          .status(400)
          .json({ success: false, message: "Driver & amount required" });

      const driver = await Driver.findById(driverId);
      if (!driver)
        return res
          .status(404)
          .json({ success: false, message: "Driver not found" });

      const entry = await DriverWallet.create({
        driverId,
        branchId,
        amount: Math.abs(clean(amount)),
        reason,
        type,
        addedBy,
        status: "pending",
      });

      res.json({
        success: true,
        message: "Transaction added (Pending Approval)",
        data: entry,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
);

/* ------------------------------------------------ */
/* APPROVE TRANSACTION (ADMIN) */
/* ------------------------------------------------ */
router.put(
  "/approve/:id",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    const entry = await DriverWallet.findById(req.params.id);
    if (!entry)
      return res
        .status(404)
        .json({ success: false, message: "Not found" });

    entry.status = "approved";
    entry.approvedBy = req.user._id;
    entry.approvedAt = new Date();
    await entry.save();

    res.json({ success: true, message: "Approved" });
  }
);

/* ------------------------------------------------ */
/* DRIVER LEDGER (PASSBOOK) */
/* ------------------------------------------------ */
router.get("/driver/:driverId", verifyToken, async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await Driver.findById(driverId).select("name mobile");
    if (!driver)
      return res
        .status(404)
        .json({ success: false, message: "Driver not found" });

    const entries = await DriverWallet.find({
      driverId,
      status: "approved",
    }).sort({ createdAt: 1 });

    let balance = 0;

    const transactions = entries.map((t) => {
      const amt =
        t.type === "reward" || t.type === "deposit"
          ? clean(t.amount)
          : -clean(t.amount);

      balance += amt;

      return {
        date: t.createdAt.toLocaleDateString("en-IN"),
        reason: t.reason,
        type: t.type,
        amount: amt,
        balance,
      };
    });

    res.json({
      driver,
      totals: { balance },
      transactions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/* ------------------------------------------------ */
/* ALL DRIVER LEDGER SUMMARY (MANAGER / ADMIN) */
/* ------------------------------------------------ */
router.get(
  "/ledger/all-drivers",
  verifyToken,
  allowRoles("manager", "admin"),
  async (req, res) => {
    const drivers = await Driver.find().select("name mobile");

    const agg = await DriverWallet.aggregate([
      { $match: { status: "approved" } },
      {
        $group: {
          _id: "$driverId",
          reward: {
            $sum: { $cond: [{ $eq: ["$type", "reward"] }, "$amount", 0] },
          },
          advance: {
            $sum: { $cond: [{ $eq: ["$type", "advance"] }, "$amount", 0] },
          },
          deposit: {
            $sum: { $cond: [{ $eq: ["$type", "deposit"] }, "$amount", 0] },
          },
          penalty: {
            $sum: { $cond: [{ $eq: ["$type", "penalty"] }, "$amount", 0] },
          },
        },
      },
    ]);

    const result = drivers.map((d) => {
      const row = agg.find(
        (x) => x._id?.toString() === d._id.toString()
      ) || {};

      const balance =
        (row.reward || 0) +
        (row.deposit || 0) -
        ((row.advance || 0) + (row.penalty || 0));

      return {
        driverId: d._id,
        name: d.name,
        mobile: d.mobile,
        balance,
      };
    });

    res.json({ success: true, data: result });
  }
);

export default router;
