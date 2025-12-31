import mongoose from "mongoose";

const InviteSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    role: { type: String, default: "telecaller" },
    status: { type: String, default: "unused" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Invite", InviteSchema);
