// src/routes/admin/post.routes.ts
import { Router } from 'express';
import { protect } from '../../middlewares/protect.js';
import { adminOnly } from '../../middlewares/adminOnly.js';
import { uploadPost } from '../../config/multer.js';

// Controllers (adjust path nếu bạn để chỗ khác)
import {
  createPost,
  getPosts,
  updatePost,
  deletePost,
  moderatePost,
} from '../../controllers/admin/post.controller.js';

const router = Router();

// All routes here require authentication
router.use(protect);

/**
 * Admin-only routes
 */
router.use(adminOnly);

// Create post (admin) - support images (1..6)
router.post('/admin', uploadPost.array('images', 6), createPost);

// List posts (admin view) - controller supports query type/isApproved/page/limit
router.get('/', getPosts);

// Update post (admin)
router.put('/:id', uploadPost.array('images', 6), updatePost);

// Delete post (admin)
router.delete('/:id', deletePost);

// Moderate a post (approve/reject)
router.post('/:id/moderate', moderatePost);

// Optional: upload single image (return file URL)
router.post('/upload-image', uploadPost.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Không có file được upload' });
  const url = `/uploads/post/${req.file.filename}`;
  res.status(201).json({ message: 'Upload thành công', file: { filename: req.file.filename, url } });
});

export default router;
