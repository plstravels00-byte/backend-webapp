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
import driverLocationRoutes from "./routes/driverLocationRoutes.js";
import driverDutyRoutes from "./routes/driverDutyRoutes.js";
import managerRoutes from "./routes/ManagerRoutes.js";
import managerTripsheetRoutes from "./routes/managerTripsheetRoutes.js";
import salarySchemeRoutes from "./routes/salarySchemeRoutes.js";
import assignSalaryRoutes from "./routes/assignSalaryRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import driverServiceRoutes from "./routes/driverServiceRoutes.js";

// ✅ BFF ROUTE (NEW)
import ledgerBffRoutes from "./routes/bff/ledgerBffRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// ✅ Socket Setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});

// ✅ Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

// ✅ Static Upload Folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =======================
// ✅ ROUTES
// =======================

// Auth & Core
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/branches", branchRoutes);

// Driver
app.use("/api/drivers", driverRoutes);
app.use("/api/driver-location", driverLocationRoutes);
app.use("/api/driver-duty", driverDutyRoutes);
app.use("/api/driver-service", driverServiceRoutes);

// Manager
app.use("/api/manager", managerRoutes);
app.use("/api/manager", managerTripsheetRoutes);

// Salary / Ledger (Internal APIs)
app.use("/api/salary-schemes", salarySchemeRoutes);
app.use("/api/driver-salary", assignSalaryRoutes);

// Vehicles
app.use("/api/vehicles", vehicleRoutes);

// ✅ BFF (FRONTEND SHOULD USE ONLY THIS FOR LEDGER)
app.use("/api/bff", ledgerBffRoutes);

// =======================
// ✅ BASE ROUTE
// =======================
app.get("/", (req, res) => {
  res.send("✅ Backend API is Live and Running!");
});

// =======================
// ✅ DATABASE
// =======================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// =======================
// ✅ SOCKET.IO
// =======================
app.set("io", io);

io.on("connection", (socket) => {
  console.log("⚡ User Connected:", socket.id);

  socket.on("updateLocation", (data) => {
    io.emit("driverLocationUpdate", data);
  });

  socket.on("joinBranch", (branchId) => {
    if (branchId) {
      socket.join(String(branchId));
      console.log(`👥 ${socket.id} joined branch ${branchId}`);
    }
  });

  socket.on("driverOnDuty", (data) => {
    if (data?.branchId) {
      io.to(String(data.branchId)).emit("driverOnDuty", data);
    }
  });

  socket.on("tripCompleted", (data) => {
    if (data?.branchId) {
      io.to(String(data.branchId)).emit("tripCompleted", data);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ User Disconnected:", socket.id);
  });
});

// =======================
// ✅ START SERVER
// =======================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🌍 Server Running on Port ${PORT}`)
);
