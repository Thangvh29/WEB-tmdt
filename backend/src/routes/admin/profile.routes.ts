// src/routes/admin/profile.routes.ts
import { Router } from 'express';
import { protect } from '../../middlewares/protect.js';
import { adminOnly } from '../../middlewares/adminOnly.js';
import { uploadAvatar } from '../../config/multer.js';

import { getProfile, updateProfile } from '../../controllers/admin/profile.controller.js'; // chỉnh path nếu cần

const router = Router();

// admin-only (profile admin)
router.use(protect);
router.use(adminOnly);

/**
 * GET /api/admin/profile/me
 * Lấy profile admin hiện tại
 */
router.get('/me', getProfile as unknown as any);

/**
 * PUT /api/admin/profile/me
 * Form-data: avatar (file) + fields: name, address, phone, email
 */
router.put('/me', uploadAvatar.single('avatar'), updateProfile as unknown as any);

export default router;
