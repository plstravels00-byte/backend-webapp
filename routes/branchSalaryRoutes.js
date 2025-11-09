const express = require("express");
const router = express.Router();

const { getSalarySchemesByBranch } = require("../controllers/branchSalaryController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, getSalarySchemesByBranch);

module.exports = router;
