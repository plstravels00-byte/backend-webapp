import AssignedSalary from "../models/AssignedSalary.js";
import SalaryScheme from "../models/SalaryScheme.js";
import Driver from "../models/Driver.js";

const assignToDriver = async (req, res) => {
  try {
    const { driverId, salarySchemeId, branchId } = req.body;

    const existing = await AssignedSalary.findOne({ driverId });
    if (existing) {
      existing.schemeId = salarySchemeId;
      existing.branchId = branchId;
      await existing.save();
      return res.json({ message: "✅ Salary Scheme Updated" });
    }

    await AssignedSalary.create({ driverId, schemeId: salarySchemeId, branchId });
    res.json({ message: "✅ Salary Scheme Assigned" });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

const getAssignedForBranch = async (req, res) => {
  try {
    const { branchId } = req.query;

    const data = await AssignedSalary.find({ branchId })
      .populate("driverId")
      .populate("schemeId");

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

const calculateSalary = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { totalEarnings, uberCommission, cngTotal, pickups } = req.query;

    const assigned = await AssignedSalary.findOne({ driverId }).populate("schemeId");
    const scheme = assigned.schemeId;

    const incentive =
      pickups >=  scheme.target ? (totalEarnings * scheme.incentiveAbove) / 100
      : (totalEarnings * scheme.incentiveBelow) / 100;

    const bonus = pickups >= 15 ? 300 : 0;
    const finalSalary = totalEarnings - uberCommission - cngTotal + incentive + bonus;

    res.json({ result: { finalSalary, incentive, bonus } });
  } catch (err) {
    res.status(500).json({ message: "Error calculating salary" });
  }
};

export default { assignToDriver, getAssignedForBranch, calculateSalary };
