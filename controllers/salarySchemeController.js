// server/controllers/salarySchemeController.js
import SalaryScheme from "../models/SalaryScheme.js";

export const getAllSchemes = async (req, res) => {
  try {
    const data = await SalaryScheme.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    console.error("❌ Error fetching schemes:", err);
    res.status(500).json({ message: err.message });
  }
};

export const createScheme = async (req, res) => {
  try {
    const scheme = new SalaryScheme(req.body);
    await scheme.save();
    res.status(201).json(scheme);
  } catch (err) {
    console.error("❌ Error saving scheme:", err);
    res.status(500).json({ message: err.message });
  }
};
