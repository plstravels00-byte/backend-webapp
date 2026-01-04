import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import authRoutes from "./routes/authRoutes.js";
import driverWalletRoutes from "./routes/driverWalletRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("Backend API is Live and Running!");
});

// 🔑 AUTH ROUTES (OTP / PASSWORD LOGIN)
app.use("/auth", authRoutes);

// 💰 WALLET ROUTES
app.use("/wallet", driverWalletRoutes);

// DB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Mongo error", err));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
