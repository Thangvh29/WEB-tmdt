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
 * Base URL sau mount: /api/admin/posts
 *
 * => Full paths đúng:
 *  - GET    /api/admin/posts/:postId/comments
 *  - POST   /api/admin/posts/:postId/comments
 *  - PATCH  /api/admin/posts/comments/:id
 *  - DELETE /api/admin/posts/comments/:id
 */

// Lấy tất cả comment trong 1 post
router.get('/:postId/comments', protect, adminOnly, getCommentsByPost);

// Thêm comment vào post
router.post('/:postId/comments', protect, adminOnly, createComment);

// Duyệt / hủy duyệt comment
router.patch('/comments/:id', protect, adminOnly, moderateComment);

// Xóa comment
router.delete('/comments/:id', protect, adminOnly, deleteComment);

export default router;
