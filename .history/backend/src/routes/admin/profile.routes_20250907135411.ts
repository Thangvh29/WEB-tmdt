// src/routes/admin/profile.routes.ts
import { Router } from "express";
import { protect } from "../../middlewares/protect.js";
import { adminOnly } from "../../middlewares/adminOnly.js";
import { uploadAvatar } from "../../config/multer.js";

import {
  getProfile,
  updateProfile,
  uploadAvatar as uploadAvatarCtrl,
  deleteAvatar,
  deactivateAccount,
} from "../../controllers/admin/profile.controller.js";

const router = Router();

// Middleware chung cho admin
router.use(protect);
router.use(adminOnly);

/**
 * GET /api/admin/profile/me
 * Lấy profile admin hiện tại
 */
router.get("/me", getProfile as unknown as any);

/**
 * PUT /api/admin/profile/me
 * Cập nhật profile (name, address, phone, email, avatar nếu có)
 */
router.put(
  "/me",
  uploadAvatar.single("avatar"),
  updateProfile as unknown as any
);

/**
 * POST /api/admin/profile/avatar
 * Upload avatar riêng biệt
 */
router.post(
  "/avatar",
  uploadAvatar.single("avatar"),
  uploadAvatarCtrl as unknown as any
);

/**
 * DELETE /api/admin/profile/avatar
 * Xóa avatar
 */
router.delete("/avatar", deleteAvatar as unknown as any);

/**
 * POST /api/admin/profile/deactivate
 * Vô hiệu hóa tài khoản admin
 */
router.post("/deactivate", deactivateAccount as unknown as any);

export default router;
