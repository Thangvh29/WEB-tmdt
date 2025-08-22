// src/routes/user/order.routes.ts
import express from 'express';
import { protect } from '../../middlewares/protect.js';
import { userOnly } from '../../middlewares/userOnly.js';
import * as OrderCtrl from '../../controllers/user/order.controller.js';

const router = express.Router();

// List orders for the current user (or admin/staff with ?userId)
router.get('/', protect, userOnly, OrderCtrl.listOrders);

// Get order detail (owner or admin/staff)
router.get('/:id', protect, OrderCtrl.getOrder);

// Get status history
router.get('/:id/history', protect, OrderCtrl.getOrderHistory);

// Quick tracking endpoint (timeline + tracking id)
router.get('/:id/track', protect, OrderCtrl.trackOrder);

export default router;
