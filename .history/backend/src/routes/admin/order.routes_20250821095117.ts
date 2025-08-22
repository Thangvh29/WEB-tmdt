// src/routes/admin/order.routes.ts
import { Router } from 'express';
import { protect } from '../../middlewares/protect.js';
import { adminOnly } from '../../middlewares/adminOnly.js';

// controllers (đã định nghĩa trước)
import {
  createOrder,
  getOrders,
  getOrderDetail,
  updateOrderStatus,
  markPaid,
  cancelOrder,
  getOrderHistory,
  updateCustomerInfo,
} from '../../controllers/admin/order.controller.js';

const router = Router();

/**
 * Routes for orders.
 *
 * - Create order: authenticated users (customers) can create -> protect (no adminOnly)
 * - Admin/staff routes: list orders, update status, markPaid, history, update customer info (admin/staff)
 */

// Create order (customer)
router.post('/', protect, createOrder);

// Admin / staff area
router.use(protect);
router.use(adminOnly);

// List orders (filter by status, pagination)
router.get('/', getOrders);

// Get single order detail
router.get('/:id', getOrderDetail);

// Update order status (admin/staff/shipper allowed by controller)
router.put('/:id/status', updateOrderStatus);

// Mark as paid (e.g., payment callback or manual)
router.post('/:id/mark-paid', markPaid);

// Update customer info (only allowed before shipped)
router.patch('/:id/customer', updateCustomerInfo);

// Cancel order (can be called by admin on behalf or by user via other route)
router.post('/:id/cancel', cancelOrder);

// Order history (delivered/failed) with failure reasons
router.get('/history/list', getOrderHistory);

export default router;
