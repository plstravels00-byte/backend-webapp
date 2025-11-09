const SalaryScheme = require("../models/SalaryScheme");

exports.getSalarySchemesByBranch = async (req, res) => {
  try {
    const user = req.user; // token மூலம் வரும் user info

    let query = {};

    // ✅ Manager என்றால் → அவரோட branch மட்டும் show ஆகணும்
    if (user.role === "manager") {
      query = {
        $or: [
          { branch: user.branch },
          { branch: "" },
          { branch: null }
        ]
      };
    }

    // ✅ Admin என்றால் → எல்லாம் show ஆகும்
    const schemes = await SalaryScheme.find(query).sort({ updatedAt: -1 });

    res.status(200).json(schemes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching data" });
  }
};
