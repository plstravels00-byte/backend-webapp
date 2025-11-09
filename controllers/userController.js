import User from "../models/User.js";
import Branch from "../models/Branch.js";
import bcrypt from "bcryptjs";

// ✅ Create New User
export const createUser = async (req, res) => {
  try {
    const { name, mobile, password, role, branch } = req.body;

    // ✅ 1. Basic Validation
    if (!name || !mobile || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ 2. Check for existing mobile number
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ message: "User with this mobile already exists" });
    }

    // ✅ 3. Create User Object
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      mobile,
      password: hashedPassword,
      role: role || "driver",
      branch: branch || null,
      createdBy: req.user?._id || null,
    });

    const savedUser = await newUser.save();

    // ✅ 4. If Manager — assign to branch
    if (role === "manager" && branch) {
      await Branch.findByIdAndUpdate(branch, { manager: savedUser._id });
    }

    res.status(201).json({
      message: "✅ User created successfully",
      user: savedUser,
    });
  } catch (err) {
    console.error("❌ Error saving manager:", err);
    res.status(500).json({ message: "Error saving manager" });
  }
};

// ✅ Fetch All Users (with branch populated)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate("branch", "name location")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ message: "Error fetching users" });
  }
};

// ✅ Delete User
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user" });
  }
};

// ✅ Toggle Hold/Unhold
export const toggleUserHold = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isHeld = !user.isHeld;
    await user.save();

    res.json({ message: "User status updated", isHeld: user.isHeld });
  } catch (err) {
    res.status(500).json({ message: "Error toggling hold status" });
  }
};
