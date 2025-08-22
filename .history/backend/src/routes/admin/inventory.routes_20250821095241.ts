// src/routes/admin/inventory.routes.ts
import { Router } from 'express';
import { protect } from '../../middlewares/protect.js';
import { adminOnly } from '../../middlewares/adminOnly.js';

// controllers
import { getInventory, updateStock } from '../../controllers/admin/inventory.controller.js';

const router = Router();

// All inventory management endpoints are admin only
router.use(protect);
router.use(adminOnly);

// GET /api/admin/inventory -> list inventory, filters
router.get('/', getInventory);

// PATCH /api/admin/inventory/:id/stock -> update stock (body: { stock, variantId? })
router.patch('/:id/stock', updateStock);

export default router;
