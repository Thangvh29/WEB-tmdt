// src/routes/user/profile.routes.ts
import { Router } from 'express';
import * as ProfileCtrl from '../../controllers/user/profile.controller.js';
import { protect } from '../../middlewares/protect.js';
import { userOnly } from '../../middlewares/userOnly.js';
// If you have multer config for avatar uploads, import it (optional)
// import { uploadAvatar } from '../../config/multer.js';

const router = Router();

// Get current profile
router.get('/', protect, userOnly, ProfileCtrl.getProfile);

// Update profile (name, address, phone, email)
router.put('/', protect, userOnly, ProfileCtrl.updateProfile);

// Upload avatar (if using multer uncomment uploadAvatar middleware)
// router.post('/avatar', protect, userOnly, uploadAvatar.single('avatar'), ProfileCtrl.uploadAvatar);
// If not using multer, frontend can send avatarUrl in body
router.post('/avatar', protect, userOnly, ProfileCtrl.uploadAvatar);

// Delete avatar
router.delete('/avatar', protect, userOnly, ProfileCtrl.deleteAvatar);

// Deactivate account
router.post('/deactivate', protect, userOnly, ProfileCtrl.deactivateAccount);

export default router;
