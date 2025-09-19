import { Router } from "express";
import { getCategories, getCategoryById } from "../../controllers/public/categories.controller.js";

const router = Router();

// Public routes (không cần login)
router.get("/", getCategories);
router.get("/:id", getCategoryById);

export default router;
