import { Router } from "express";
import { protect } from "../../middlewares/protect.js";
import { adminOnly } from "../../middlewares/adminOnly.js";
import { getCategories, getCategoryTree, createCategory } from "../../controllers/admin/category.controller.js";

const router = Router();

router.use(protect);
router.use(adminOnly);

router.get("/", getCategories);
router.get("/tree", getCategoryTree);
router.post("/", createCategory);

export default router;
