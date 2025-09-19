import { Router } from 'express';
import { protect } from '../../middlewares/protect.js';
import { adminOnly } from '../../middlewares/adminOnly.js';
import {
  createComment,
  getCommentsByPost,
  moderateComment,
  deleteComment,
} from '../../controllers/admin/comment.controller.js';

const router = Router();

/**
 * Base URL (sau khi mount): /api/admin/posts
 *
 * Ví dụ:
 *  - GET    /api/admin/posts/:postId/comments
 *  - POST   /api/admin/posts/:postId/comments
 *  - PATCH  /api/admin/posts/comments/:id
 *  - DELETE /api/admin/posts/comments/:id
 */

// Admin lấy tất cả comment trong 1 post
router.get('/:postId/comments', protect, adminOnly, getCommentsByPost);

// Admin thêm comment vào post
router.post('/:postId/comments', protect, adminOnly, createComment);

// Admin duyệt / unapprove comment
router.patch('/comments/:id', protect, adminOnly, moderateComment);

// Admin xóa comment
router.delete('/comments/:id', protect, adminOnly, deleteComment);

export default router;
