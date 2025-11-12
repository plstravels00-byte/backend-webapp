import React, { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const API_BASE = "https://backend-webapp-vk8x.onrender.com";

const ManagerAddReward = () => {
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState({
    driverId: "",
    amount: "",
    reason: "",
  });

  useEffect(() => {
    loadDrivers();
  }, []);

  // 🔹 Fetch all drivers
  const loadDrivers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/drivers`);
      setDrivers(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load drivers");
    }
  };

  // 🔹 Add Reward
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.driverId || !form.amount || !form.reason) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      await axios.post(`${API_BASE}/api/wallet/add`, {
        driverId: form.driverId,
        amount: form.amount,
        reason: form.reason,
        addedBy: "manager", // optional — backend will link actual user if session available
      });
      toast.success("Reward added successfully 🎉");
      setForm({ driverId: "", amount: "", reason: "" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to add reward");
    }
  };

  return (
    <div className="text-gray-800">
      <Toaster />
      <h2 className="text-2xl font-bold text-green-600 mb-4">
        ➕ Add Wallet Reward (Manager)
      </h2>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-md max-w-3xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* Driver Select */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              Select Driver
            </label>
            <select
              value={form.driverId}
              onChange={(e) =>
                setForm({ ...form, driverId: e.target.value })
              }
              className="border border-gray-300 rounded p-2 w-full"
            >
              <option value="">Choose Driver</option>
              {drivers.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.mobile})
                </option>
              ))}
            </select>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              Reward Amount (₹)
            </label>
            <input
              type="number"
              placeholder="Enter Amount"
              value={form.amount}
              onChange={(e) =>
                setForm({ ...form, amount: e.target.value })
              }
              className="border border-gray-300 rounded p-2 w-full"
            />
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              Reason / Note
            </label>
            <input
              type="text"
              placeholder="Enter Reason"
              value={form.reason}
              onChange={(e) =>
                setForm({ ...form, reason: e.target.value })
              }
              className="border border-gray-300 rounded p-2 w-full"
            />
          </div>

          {/* Submit Button */}
          <div className="md:col-span-3">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg mt-2 w-full md:w-auto"
            >
              Add Reward
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 text-sm text-gray-600 text-center">
        After adding, Admin needs to approve this reward to reflect in driver wallet.
      </div>
    </div>
  );
};

export default ManagerAddReward;
