import express from "express";
import { getAllSchemes, createScheme } from "../controllers/salarySchemeController.js";

const router = express.Router();

// ✅ All salary scheme list
router.get("/all", getAllSchemes);

// ✅ Create new salary scheme
router.post("/create", createScheme);

export default router;
