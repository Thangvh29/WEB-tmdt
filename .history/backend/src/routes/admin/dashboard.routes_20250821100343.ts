// src/routes/admin/dashboard.routes.ts
import { Router } from 'express';
import { protect } from '../../middlewares/protect.js';
import { adminOnly } from '../../middlewares/adminOnly.js';

import { getDashboardStats } from '../../controllers/admin/dashboard.controller.js'; // chỉnh path nếu cần

const router = Router();

router.use(protect);
router.use(adminOnly);

/**
 * GET /api/admin/dashboard/stats?startDate=&endDate=&period=
 * period: today | week | month | year
 */
router.get('/stats', getDashboardStats as unknown as any);

export default router;
