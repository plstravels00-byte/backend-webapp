import express from "express";
import Branch from "../models/Branch.js";

const router = express.Router();

/**
 * @route   POST /api/branches/add-branch
 * @desc    Add a new branch (no manager required)
 */
router.post("/add-branch", async (req, res) => {
  try {
    const { name, location } = req.body;

    // Validate inputs
    if (!name || !location) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Create and save branch
    const branch = new Branch({
      name,
      location,
      isHeld: false,
    });

    await branch.save();
    res.status(201).json(branch);
  } catch (err) {
    console.error("Add Branch Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

/**
 * @route   GET /api/branches
 * @desc    Get all branches
 */
router.get("/", async (req, res) => {
  try {
    const branches = await Branch.find();
    res.json(branches);
  } catch (err) {
    console.error("Get Branches Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

/**
 * @route   DELETE /api/branches/:id
 * @desc    Delete a branch
 */
router.delete("/:id", async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    await branch.deleteOne();
    res.json({ message: "Branch deleted" });
  } catch (err) {
    console.error("Delete Branch Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

/**
 * @route   PATCH /api/branches/:id/toggle
 * @desc    Toggle branch hold status
 */
router.patch("/:id/toggle", async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    branch.isHeld = !branch.isHeld;
    await branch.save();
    res.json(branch);
  } catch (err) {
    console.error("Toggle Branch Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
