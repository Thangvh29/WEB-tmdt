// src/routes/admin/payment.routes.ts
import { Router } from "express";
import { protect } from "../../middlewares/protect.js";
import { adminOnly } from "../../middlewares/adminOnly.js";

// controllers (sẽ định nghĩa trong admin/payment.controller.ts)
import {
  getPayments,
  getPaymentDetail,
  updatePaymentStatus,
  getPaymentHistory,
} from "../../controllers/admin/payment.controller.js";

const router = Router();

/**
 * Routes for payments (admin/staff only).
 *
 * - List payments
 * - Get payment detail
 * - Update payment status
 * - View payment history (success/failed)
 */

// Admin / staff area
router.use(protect);
router.use(adminOnly);

// List all payments (with filter, pagination)
router.get("/", getPayments);

// Get single payment detail
router.get("/:id", getPaymentDetail);

// Update payment status (e.g., mark as success/failed/refunded)
router.put("/:id/status", updatePaymentStatus);

// Payment history (success/failed) with pagination
router.get("/history/list", getPaymentHistory);

export default router;
