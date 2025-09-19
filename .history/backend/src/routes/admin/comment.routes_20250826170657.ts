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

// Admin thêm comment vào post
router.post('/posts/:postId/comments', protect, adminOnly, createComment);

// Admin lấy tất cả comment trong 1 post
router.get('/posts/:postId/comments', protect, adminOnly, getCommentsByPost);

// Admin duyệt / unapprove comment
router.patch('/:id', protect, adminOnly, moderateComment);

// Admin xóa comment
router.delete('/comments/:id', protect, adminOnly, deleteComment);

export default router;
