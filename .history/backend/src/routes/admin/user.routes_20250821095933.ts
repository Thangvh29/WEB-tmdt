// src/routes/admin/user.routes.ts
import { Router } from 'express';
import { protect } from '../../middlewares/protect.js';
import { adminOnly } from '../../middlewares/adminOnly.js';
import { uploadAvatar } from '../../config/multer.js';

// Controllers (chỉnh đường dẫn nếu bạn đặt controller ở chỗ khác)
import {
  getUsers,        // danh sách (nếu bạn export ở file khác, chỉnh đường dẫn)
  getUserDetail,   // chi tiết user
  updateUser,      // cập nhật user (admin)
  deleteUser,      // soft-delete (isActive=false)
  restoreUser,     // restore user
  hardDeleteUser,  // hard delete
} from '../../controllers/admin/user.controller.js';

import { getProfile, updateProfile } from '../../controllers/admin/profile.controller.js'; // nếu bạn để profile controller ở nơi khác, chỉnh lại đường dẫn

const router = Router();

// Tất cả route quản lý user đều yêu cầu auth + adminOnly
router.use(protect);
router.use(adminOnly);

/**
 * NOTE: đặt các route cụ thể trước route '/:id' để tránh conflit.
 * Admin's own profile (đặt trước /:id để không bị hiểu id='me')
 */
router.get('/me/profile', getProfile);
router.put('/me/profile', uploadAvatar.single('avatar'), updateProfile);

/**
 * List users
 * GET /api/admin/users?search=&page=&limit=
 */
router.get('/', getUsers);

/**
 * Dangerous / specific endpoints - đặt trước :id
 */
// Hard delete (dangerous)
router.delete('/:id/hard', hardDeleteUser);

// Restore user
router.post('/:id/restore', restoreUser);

/**
 * Update / soft delete / detail
 */
// Update user (admin edits) - supports avatar upload
router.patch('/:id', uploadAvatar.single('avatar'), updateUser);

// Soft delete (deactivate)
router.delete('/:id', deleteUser);

// Get user detail (last, generic)
router.get('/:id', getUserDetail);

export default router;
