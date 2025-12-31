import express from "express";
import Lead from "../models/Lead.js";

const router = express.Router();

// ⭐ Create a new lead
router.post("/call", async (req, res) => {
  try {
    const lead = new Lead(req.body);
    await lead.save();

    res.json({
      status: "ok",
      lead,
      id: lead._id,
    });
  } catch (err) {
    res.json({ status: "error", message: err.message });
  }
});

// ⭐ Get all leads
router.get("/list", async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });

    res.json({
      status: "ok",
      leads: leads.map((lead) => ({
        _id: lead._id,
        name: lead.name,
        mobile: lead.mobile,
        place: lead.place,
        date: lead.date,
        description: lead.description,
        completed: lead.completed,
        branch: lead.branch,
        createdAt: lead.createdAt,
      })),
    });
  } catch (err) {
    res.json({ status: "error", message: err.message });
  }
});

// ⭐ Today's follow-up count
router.get("/today", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const count = await Lead.countDocuments({
      date: today,
      completed: false,
    });

    res.json({ status: "ok", count });
  } catch (err) {
    res.json({ status: "error", message: err.message });
  }
});

// ⭐ Mark Completed
router.post("/complete", async (req, res) => {
  try {
    const { id } = req.body;

    await Lead.findByIdAndUpdate(id, { completed: true });

    res.json({ status: "ok" });
  } catch (err) {
    res.json({ status: "error", message: err.message });
  }
});


// ⭐⭐⭐ ADD THIS NEW ROUTE — Update Lead Date ⭐⭐⭐
router.post("/update-date", async (req, res) => {
  try {
    const { id, date } = req.body;

    if (!id || !date)
      return res.json({ status: "error", message: "Missing fields" });

    await Lead.findByIdAndUpdate(id, { date });

    res.json({ status: "ok" });
  } catch (err) {
    res.json({ status: "error", message: err.message });
  }
});


export default router;
