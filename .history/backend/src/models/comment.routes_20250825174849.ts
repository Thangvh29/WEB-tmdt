// routes/admin/comment.routes.ts
import { Router } from 'express';
import { protect } from '../../middlewares/protect.js';
import { adminOnly } from '../../middlewares/adminOnly.js';
import {
  createComment,
  getCommentsByPost,
  moderateComment,
  deleteComment,
} from '../../controllers/admin/comment.controller.';

const router = Router();

// public to authenticated users: create comment under post
router.post('/posts/:postId/comments', protect, createComment); // note: in controller we use body.post or parent; you can adapt to use param
router.get('/posts/:postId/comments', protect, getCommentsByPost);

// admin moderation / delete
router.patch('/comments/:id', protect, adminOnly, moderateComment);
router.delete('/comments/:id', protect, deleteComment); // allow author or admin (middleware will check inside)

export default router;
