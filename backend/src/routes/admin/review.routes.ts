// src/routes/admin/review.routes.ts
import { Router } from 'express';
import { protect } from '../../middlewares/protect.js';
import { adminOnly } from '../../middlewares/adminOnly.js';

// Controllers for reviews (comment)
import {
  getReviews,
  approveReview,
  unapproveReview,
  replyReview,
  deleteReview,
} from '../../controllers/admin/review.controller.js';

const router = Router();

// Admin only
router.use(protect);
router.use(adminOnly);

/**
 * GET /api/admin/reviews
 * Query: productId (required), status (optional: pending|approved|rejected), page, limit
 */
router.get('/', getReviews);

/**
 * POST /api/admin/reviews/:id/approve
 */
router.post('/:id/approve', approveReview);

/**
 * POST /api/admin/reviews/:id/unapprove
 */
router.post('/:id/unapprove', unapproveReview);

/**
 * POST /api/admin/reviews/:id/reply
 * Body: { content }
 */
router.post('/:id/reply', replyReview);

/**
 * DELETE /api/admin/reviews/:id
 */
router.delete('/:id', deleteReview);

export default router;
