// src/routes/admin/inventory.routes.ts
import { Router } from "express";
import { protect } from "../../middlewares/protect.js";
import { adminOnly } from "../../middlewares/adminOnly.js";
import {
  getInventory,
  updateStock,
} from "../../controllers/admin/inventory.controller.js";

const router = Router();

router.use(protect);
router.use(adminOnly);

// Quản lý tồn kho
router.get("/list", getInventory);
router.patch("/:id/stock", updateStock);

export default router;
