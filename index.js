import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";

// Routes
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

dotenv.config();
const app = express();
const server = http.createServer(app);

const io = new Server(server, { cors: { origin: "*" } });

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

// Static Upload Directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
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

app.get("/", (req, res) => res.send("✅ Backend Live"));

// Database
mongoose.connect(process.env.MONGO_URI).then(() => console.log("✅ Mongo Connected"));

// Socket
io.on("connection", (socket) => {
  console.log("⚡ Socket connected:", socket.id);
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🌍 Server Running on port ${PORT}`));
