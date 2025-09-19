import { Router } from "express";
import { getCategories } from "../../controllers/user/category.controller.js";
import { protect } from "../../middlewares/protect.js";
import { userOnly } from "../../middlewares/userOnly.js";

const router = Router();

// Yêu cầu đăng nhập và phải là user
router.use(protect);
router.use(userOnly);

router.get("/", getCategories);

export default router;
