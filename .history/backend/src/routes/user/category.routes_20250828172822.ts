// src/routes/user/category.routes.js
import { Router } from "express";
import { protect } from "../../middlewares/protect.js";
import { userOnly } from "../../middlewares/userOnly.js";
import { getCategories } from "../../controllers/user/category.controller.js";

const router = Router();

// Áp middleware chung cho tất cả routes
router.use(protect);
router.use(userOnly);

// Lấy danh mục
router.get("/", getCategories);

export default router;
