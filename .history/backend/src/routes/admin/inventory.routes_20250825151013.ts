// src/routes/admin/inventory.routes.ts
import { Router } from "express";
import { protect } from "../../middlewares/protect.js";
import { adminOnly } from "../../middlewares/adminOnly.js";
import { getInventory, updateStock } from "../../controllers/admin/inventory.controller.js";

const router = Router();

router.use(protect);
router.use(adminOnly);

/**
 * GET /api/admin/products/inventory/list
 * - Danh sách tồn kho
 */
router.get("/list", getInventory);

/**
 * PATCH /api/admin/products/inventory/:id/stock
 * - Cập nhật tồn kho
 */
router.patch("/:id/stock", updateStock);

export default router;
