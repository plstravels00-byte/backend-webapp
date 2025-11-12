import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";

// ✅ Import Routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import branchRoutes from "./routes/branchRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import driverDutyRoutes from "./routes/driverDutyRoutes.js";
import managerRoutes from "./routes/ManagerRoutes.js";
import managerTripsheetRoutes from "./routes/managerTripsheetRoutes.js";
import salarySchemeRoutes from "./routes/salarySchemeRoutes.js";
import assignSalaryRoutes from "./routes/assignSalaryRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";

// ✅ Newly Added Route
import walletRoutes from "./routes/walletRoutes.js";

dotenv.config();
const app = express();
const server = http.createServer(app);

// ✅ Socket Setup
const io = new Server(server, { cors: { origin: "*" } });

// ✅ Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

// ✅ FIX — Mobile PDF Viewer “Failed to load” Issue
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

// ✅ Static Upload Directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/driver-duty", driverDutyRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/manager", managerTripsheetRoutes);
app.use("/api/salary-schemes", salarySchemeRoutes);
app.use("/api/driver-salary", assignSalaryRoutes);
app.use("/api/vehicles", vehicleRoutes);

// ✅ NEW: Wallet & Rewards API
app.use("/api/wallet", walletRoutes);

// ✅ Root Route
app.get("/", (req, res) => res.send("✅ Backend is Live & Wallet API Added!"));

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err));

// ✅ Socket Setup
io.on("connection", (socket) => {
  console.log("⚡ Socket connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🌍 Server Running on port ${PORT}`));
