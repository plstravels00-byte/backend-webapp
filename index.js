import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";

// ✅ Import all route files
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import branchRoutes from "./routes/branchRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import driverLocationRoutes from "./routes/driverLocationRoutes.js";
import driverDutyRoutes from "./routes/driverDutyRoutes.js";
import managerRoutes from "./routes/managerRoutes.js";
import managerTripsheetRoutes from "./routes/managerTripsheetRoutes.js";
import salarySchemeRoutes from "./routes/salarySchemeRoutes.js";
import assignSalaryRoutes from "./routes/assignSalaryRoutes.js";

// ✅ NEW: Vehicle Routes
import vehicleRoutes from "./routes/vehicleRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// ✅ Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});

// ✅ Middleware setup
app.use(cors());
app.use(express.json());

// ✅ Setup file upload folder (static access)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/driver-location", driverLocationRoutes);
app.use("/api/driver-duty", driverDutyRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/manager", managerTripsheetRoutes);
app.use("/api/salary-schemes", salarySchemeRoutes);
app.use("/api/driver-salary", assignSalaryRoutes);

// ✅ NEW: Vehicle Route
app.use("/api/vehicles", vehicleRoutes);

// ✅ API Test Endpoint
app.get("/", (req, res) => {
  res.send("🚀 Backend API is running successfully!");
});

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Socket.io Events
app.set("io", io);

io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

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
    if (data?.branchId) io.to(String(data.branchId)).emit("driverOnDuty", data);
  });

  socket.on("tripCompleted", (data) => {
    if (data?.branchId) io.to(String(data.branchId)).emit("tripCompleted", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// ✅ Server start
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));
