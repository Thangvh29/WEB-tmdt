// src/routes/user/product.routes.ts
import express from 'express';
import * as ProductCtrl from '../../controllers/user/product.controller.js';
import { protect } from '../../middlewares/protect.js'; // optional for routes that might use req.user

const router = express.Router();

// Public listing & filters (no auth required)
router.get('/', ProductCtrl.listProducts);
router.get('/filters', ProductCtrl.getProductFilters);

// Product detail (public) - we pass through protect optionally so req.user may exist (but not required).
// If you mount under /api/user/... and want protect to load user doc, use protect middleware.
// For public endpoint we keep it unauthenticated but controller tolerates req.user missing.
router.get('/:id', ProductCtrl.getProductDetail);

// Related
router.get('/:id/related', ProductCtrl.getRelatedProducts);

// Reviews
router.get('/:id/reviews', ProductCtrl.getProductReviews);

// Variant check (allows POST body) - public
router.post('/:id/check-variant', ProductCtrl.checkVariant);

export default router;
