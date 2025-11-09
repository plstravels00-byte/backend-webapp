import express from "express";
import User from "../models/User.js";
import Branch from "../models/Branch.js";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/* -------------------------------
   ✅ Add New User (Admin Only)
--------------------------------*/
router.post("/add", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const { name, mobile, password, role, branch } = req.body;

    if (!name || !mobile || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await User.findOne({ mobile });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = new User({
      name,
      mobile,
      password,
      role,
      branch: branch || null,
    });

    await newUser.save();

    // ✅ If role is manager → set that manager in branch
    if (role === "manager" && branch) {
      await Branch.findByIdAndUpdate(branch, { manager: newUser._id });
    }

    res.status(201).json({
      message: "✅ User added successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        mobile: newUser.mobile,
        role: newUser.role,
        branch: newUser.branch,
      },
    });
  } catch (err) {
    console.error("❌ Error adding user:", err);
    res.status(500).json({ message: "Error adding user", error: err.message });
  }
});

/* -------------------------------
   ✅ Get All Users (Admin Only)
--------------------------------*/
router.get("/", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const users = await User.find()
      .populate("branch", "name location")
      .select("-password");
    res.json(users);
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ message: "Error fetching users", error: err.message });
  }
});

/* -------------------------------
   ✅ Update User (Admin Only)
--------------------------------*/
router.put("/:id", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const { name, mobile, role, branch } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, mobile, role, branch },
      { new: true }
    )
      .populate("branch", "name")
      .select("-password");

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    res.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("❌ Error updating user:", err);
    res.status(500).json({ message: "Error updating user", error: err.message });
  }
});

/* -------------------------------
   ✅ Delete User (Admin Only)
--------------------------------*/
router.delete("/:id", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    res.status(500).json({ message: "Error deleting user", error: err.message });
  }
});

/* -------------------------------
   ✅ Toggle Hold Status (Admin Only)
--------------------------------*/
router.patch("/:id/toggle", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isHeld = !user.isHeld;
    await user.save();

    res.json({ message: "User status updated", isHeld: user.isHeld });
  } catch (err) {
    console.error("❌ Error toggling user status:", err);
    res.status(500).json({ message: "Error toggling status", error: err.message });
  }
});

/* -------------------------------
   ✅ Assign Branch to Manager (Admin Only)
--------------------------------*/
router.patch("/:id/assign-branch", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const { branch } = req.body;
    if (!branch) {
      return res.status(400).json({ message: "Branch ID is required" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role !== "manager") {
      return res.status(400).json({ message: "Only managers can be assigned a branch" });
    }

    user.branch = branch;
    await user.save();

    await Branch.findByIdAndUpdate(branch, { manager: user._id });

    res.json({
      message: `✅ Branch assigned to ${user.name}`,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        branch: user.branch,
      },
    });
  } catch (err) {
    console.error("❌ Error assigning branch:", err);
    res.status(500).json({ message: "Error assigning branch", error: err.message });
  }
});

export default router;
