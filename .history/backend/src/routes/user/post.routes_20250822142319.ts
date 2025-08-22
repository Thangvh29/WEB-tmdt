// src/routes/user/post.routes.ts
import express from 'express';
import { protect } from '../../middlewares/protect.js';
import { userOnly } from '../../middlewares/userOnly.js';

// Named imports: phải tồn tại exactly trong controllers/user/post.controller.ts
import {
  getHomeFeed,
  createPost,
  deletePost,
  likePost,
  unlikePost,
  commentOnPost,
  getPostComments,
  getFeed,         // optional: nếu bạn muốn route chung /feed cho authenticated users
  getUserPosts,    // optional: nếu cần cung cấp endpoint lấy post của chính user
  getPostDetail,   // optional detail route
  updatePost       // optional update route
} from '../../controllers/user/post.controller.js';

const router = express.Router();

// HOME FEED (public to authenticated users) -> GET /api/user/posts/feed
router.get('/feed', protect, getHomeFeed);

// Alternative generic feed (if you want to expose the other implementation)
// router.get('/feed-all', protect, getFeed);

// Create post - only users
router.post('/', protect, userOnly, createPost);

// Get user's own posts (optional)
router.get('/user', protect, userOnly, getUserPosts);

// Get post detail (optional)
router.get('/:id', protect, getPostDetail);

// Update post (owner or admin - controller checks)
router.put('/:id', protect, updatePost);

// Delete post (soft-delete) - owner or admin (controller checks)
router.delete('/:id', protect, deletePost);

// Like / Unlike - only users
router.post('/:id/like', protect, userOnly, likePost);
router.post('/:id/unlike', protect, userOnly, unlikePost);

// Comments: add comment (POST) and list comments (GET)
router.post('/:id/comments', protect, userOnly, commentOnPost);
router.get('/:id/comments', protect, getPostComments);

export default router;
