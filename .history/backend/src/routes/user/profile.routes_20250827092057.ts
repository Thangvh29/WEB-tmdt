import { Router } from "express";
import { protect } from "../../middlewares/protect.js";
import { userOnly } from "../../middlewares/userOnly.js";
import { uploadAvatar } from "../../config/multer.js";

import {
  getProfile,
  updateProfile,
  uploadAvatar as uploadAvatarCtrl,
  deleteAvatar,
  deactivateAccount,
} from "../../controllers/user/profile.controller.js";

const router = Router();

// Middleware chung cho user
router.use(protect);
router.use(userOnly);

/**
 * GET /api/user/profile/me
 * Lấy profile user hiện tại
 */
router.get("/me", getProfile as unknown as any);

/**
 * PUT /api/user/profile/me
 * Cập nhật profile (name, address, phone, email, avatar nếu có)
 * Form-data: avatar (file) + các fields khác
 */
router.put(
  "/me",
  uploadAvatar.single("avatar"),
  updateProfile as unknown as any
);

/**
 * POST /api/user/profile/avatar
 * Upload avatar riêng biệt
 */
router.post(
  "/avatar",
  uploadAvatar.single("avatar"),
  uploadAvatarCtrl as unknown as any
);

/**
 * DELETE /api/user/profile/avatar
 * Xóa avatar
 */
router.delete("/avatar", deleteAvatar as unknown as any);

/**
 * POST /api/user/profile/deactivate
 * Vô hiệu hóa tài khoản user
 */
router.post("/deactivate", deactivateAccount as unknown as any);

export default router;
