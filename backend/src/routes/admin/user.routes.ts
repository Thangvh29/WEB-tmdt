// src/routes/admin/user.routes.ts
import { Router } from 'express';
import { protect } from '../../middlewares/protect.js';
import { adminOnly } from '../../middlewares/adminOnly.js';
import { uploadAvatar } from '../../config/multer.js';

import {
  getUsers,
  getUserDetail,
  updateUser,
  deleteUser,
  restoreUser,
  hardDeleteUser,
} from '../../controllers/admin/user.controller.js';

import { getProfile, updateProfile } from '../../controllers/admin/profile.controller.js';

const router = Router();

router.use(protect);
router.use(adminOnly);

// Admin's own profile endpoints (put before /:id so 'me' won't be treated as id)
router.get('/me/profile', getProfile as unknown as any);
router.put('/me/profile', uploadAvatar.single('avatar'), updateProfile as unknown as any);

// List users
router.get('/', getUsers as unknown as any);

// Dangerous / specific endpoints - put before :id
router.delete('/:id/hard', hardDeleteUser as unknown as any);
router.post('/:id/restore', restoreUser as unknown as any);

// Update user (admin edits) - supports avatar upload
// Note: we cast updateUser to any so TS won't complain about ValidationChain[]
router.patch('/:id', uploadAvatar.single('avatar'), updateUser as unknown as any);

// Soft delete (deactivate)
router.delete('/:id', deleteUser as unknown as any);

// Get user detail
router.get('/:id', getUserDetail as unknown as any);

export default router;
