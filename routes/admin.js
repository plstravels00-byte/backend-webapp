// 🟢 Get Admin Stats
router.get("/stats", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const totalDrivers = await User.countDocuments({ role: "driver" });
    const activeDrivers = await User.countDocuments({ role: "driver", status: "active" });
    const offlineDrivers = await User.countDocuments({ role: "driver", status: "offline" });
    const pendingDrivers = await User.countDocuments({ role: "driver", approved: false });
    const pendingSalaries = await Salary.countDocuments({ status: "pending" });

    res.json({ totalDrivers, activeDrivers, offlineDrivers, pendingDrivers, pendingSalaries });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
