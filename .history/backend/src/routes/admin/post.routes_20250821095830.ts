// src/routes/admin/post.routes.ts
import { Router } from 'express';
import { protect } from '../../middlewares/protect.js';
import { adminOnly } from '../../middlewares/adminOnly.js';
import { uploadPost } from '../../config/multer.js';

// Controller (chắc chắn export tên giống trong controllers/post.controller.ts)
import {
  createPost,
  getFeed,
  getUserPosts,
  getPostDetail,
  updatePost,
  deletePost,
  moderatePost,
  likePost,
  unlikePost,
} from '../../controllers/admin/post.controller.js'; // nếu controller nằm ở ../controllers/post.controller.ts, chỉnh lại đường dẫn

const router = Router();

// Public feed (any authenticated user can access; if you want public no-auth, remove protect)
router.get('/feed', protect, getFeed);

// Get posts by user (admin or user's own posts)
router.get('/user', protect, getUserPosts);

// Get post detail
router.get('/:id', protect, getPostDetail);

// Create post (support multipart images if sent)
router.post('/', protect, uploadPost.array('images', 6), createPost);

// Update post
router.put('/:id', protect, uploadPost.array('images', 6), updatePost);

// Delete post (soft)
router.delete('/:id', protect, deletePost);

// Like / Unlike
router.post('/:id/like', protect, likePost);
router.post('/:id/unlike', protect, unlikePost);

/**
 * Admin moderation endpoints (only admin)
 */
router.post('/:id/moderate', protect, adminOnly, moderatePost);

// optional image upload endpoint for frontend to get url first
router.post('/upload-image', protect, adminOnly, uploadPost.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Không có file được upload' });
  const url = `/uploads/post/${req.file.filename}`;
  res.status(201).json({ message: 'Upload thành công', file: { filename: req.file.filename, url } });
});

export default router;
