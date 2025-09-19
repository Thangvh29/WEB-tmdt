// src/routes/admin/post.routes.ts
import { Router } from 'express';
import { protect } from '../../middlewares/protect.js';
import { adminOnly } from '../../middlewares/adminOnly.js';
import { uploadPost } from '../../config/multer.js';
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
  openConversationWithAuthor 
} from '../../controllers/admin/post.controller.js';

const router = Router();

// Lấy feed
router.get('/feed', protect, getFeed);

// Lấy post của user
router.get('/user', protect, getUserPosts);

// Lấy chi tiết post
router.get('/:id', protect, getPostDetail);

// Tạo post (nhiều ảnh, trả absolute URL)
router.post('/', protect, uploadPost.array('images', 6), createPost);

// Cập nhật post (nhiều ảnh, trả absolute URL)
router.put('/:id', protect, uploadPost.array('images', 6), updatePost);

// Xóa post
router.delete('/:id', protect, deletePost);

// Like / Unlike
router.post('/:id/like', protect, likePost);
router.post('/:id/unlike', protect, unlikePost);

// Admin moderate
router.post('/:id/moderate', protect, adminOnly, moderatePost);

// ✅ FIXED: Upload ảnh lẻ với đường dẫn đúng
router.post('/upload-image', protect, uploadPost.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Không có file được upload' });
  }

  // ✅ FIX: Sử dụng đường dẫn nhất quán với multer config
  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/post/${req.file.filename}`;

  res.status(201).json({
    message: 'Upload thành công',
    file: {
      filename: req.file.filename,
      url: fileUrl,
    },
  });
});

export default router;