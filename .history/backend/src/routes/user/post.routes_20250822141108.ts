// src/routes/user/post.routes.ts
import express from 'express';
import * as PostCtrl from '../../controllers/user/post.controller.js';
import { protect } from '../../middlewares/protect.js';
import { userOnly } from '../../middlewares/userOnly.js';

const router = express.Router();

// Feed (home) - authenticated users; mounted under /api/user/posts/feed
router.get('/feed', protect, PostCtrl.getHomeFeed);

// Create post - only users
router.post('/', protect, userOnly, PostCtrl.createPost);

// Delete post - allow owner or admin (controller checks)
router.delete('/:id', protect, PostCtrl.deletePost);

// Like / Unlike - only users
router.post('/:id/like', protect, userOnly, PostCtrl.likePost);
router.post('/:id/unlike', protect, userOnly, PostCtrl.unlikePost);

// Comments
router.post('/:id/comments', protect, userOnly, PostCtrl.commentOnPost);
router.get('/:id/comments', protect, PostCtrl.getPostComments);

export default router;
