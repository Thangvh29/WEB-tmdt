// src/routes/user/order.routes.ts
import express from 'express';
import * as OrderCtrl from '../../controllers/user/order.controller.js';
import { protect } from '../../middlewares/protect.js';
import { userOnly } from '../../middlewares/userOnly.js';

const router = express.Router();

// List user's orders (history)
router.get('/', protect, userOnly, OrderCtrl.getUserOrders);

// Get a specific order detail (must be owner)
router.get('/:id', protect, userOnly, OrderCtrl.getUserOrderDetail);

export default router;
