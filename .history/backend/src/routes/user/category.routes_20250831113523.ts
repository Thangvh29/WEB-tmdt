// src/routes/user/category.routes.js
import { Router } from "express";
import { protect } from "../../middlewares/protect.js";
import { userOnly } from "../../middlewares/userOnly.js";
import { getCategories, getCategoryById } from "../../controllers/user/categories.controller";

const router = Router();

// Áp middleware chung cho tất cả routes
router.use(protect);
router.use(userOnly);

// Lấy danh mục
router.get("/", getCategories);
router.get("/:id", getCategoryById);
export default router;
