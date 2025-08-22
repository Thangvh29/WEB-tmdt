// src/routes/admin/user.routes.ts
import { Router } from 'express';
import { protect } from '../../middlewares/protect.js';
import { adminOnly } from '../../middlewares/adminOnly.js';
import { uploadAvatar } from '../../config/multer.js';

// Controllers (adjust paths to where bạn lưu controllers)
import {
  getUsers,
  getUserById,
  updateUserById,,
} from '../../controllers/admin/user.controller.js';

import {
  getProfile,
  updateProfile,
} from '../../controllers/admin/profile.controller.js'; // nếu bạn lưu profile controller nơi khác, chỉnh lại path

const router = Router();

/**
 * Admin-only: user management
 */
router.use(protect);
router.use(adminOnly);

// GET /api/admin/users?search=&page=&limit=
router.get('/', getUsers);

// GET /api/admin/users/:id
router.get('/:id', getUserById);

// PUT /api/admin/users/:id  (update user by admin)
router.put('/:id', uploadAvatar.single('avatar'), updateUserById);

// DELETE /api/admin/users/:id
router.delete('/:id', deleteUserById);

/**
 * Admin's own profile endpoints (optional)
 * These are protected but not necessarily adminOnly (we already are under adminOnly)
 * You may want to expose /api/admin/users/me (GET/PUT) for the logged-in admin to edit his profile.
 */
router.get('/me/profile', getProfile);
router.put('/me/profile', uploadAvatar.single('avatar'), updateProfile);

export default router;
