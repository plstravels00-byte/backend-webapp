import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Driver from "../models/Driver.js";

/**
 * ✅ Verify JWT Token for any logged-in user (Admin / Manager / Driver)
 */
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 🔸 Check for Bearer token
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    // 🔸 Decode and verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔸 Extract user ID from payload
    const userId = decoded.id || decoded.userId || decoded._id;

    // 🔸 Try fetching from User (Admin/Manager)
    let user = await User.findById(userId).select("-password");

    // 🔸 If not found, check Driver collection
    if (!user) {
      user = await Driver.findById(userId).select("-password");
    }

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // ✅ Attach user data to request
    req.user = user;
    next();
  } catch (err) {
    console.error("❌ Token Verification Error:", err.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

/**
 * ✅ Role-based Access Control
 * @example allowRoles("admin", "manager")
 */
export const allowRoles = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized: No user context" });
      }

      // 🔒 Check if user's role is allowed
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          message: `Access denied: Only ${roles.join(", ")} allowed`,
        });
      }

      next();
    } catch (err) {
      console.error("❌ Role Check Error:", err.message);
      return res.status(500).json({ message: "Server error in role validation" });
    }
  };
};

/**
 * ✅ Optional: Branch-based access control (for managers)
 * Ensures manager can only act within their own branch
 */
export const verifyBranchAccess = (modelName = "branch") => {
  return (req, res, next) => {
    try {
      if (req.user.role !== "admin" && req.user.role !== "manager") {
        return res.status(403).json({ message: "Access denied for this role" });
      }

      const branchId = req.body[modelName] || req.params.branchId;
      if (req.user.role === "manager" && branchId && branchId !== req.user.branch?.toString()) {
        return res
          .status(403)
          .json({ message: "You can only modify data in your assigned branch" });
      }

      next();
    } catch (err) {
      console.error("❌ Branch Access Error:", err.message);
      return res.status(500).json({ message: "Server error verifying branch access" });
    }
  };
};
