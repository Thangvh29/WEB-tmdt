// src/routes/user/post.routes.ts
import express from 'express';
import * as PostCtrl from '../../controllers/user/post.controller.js';
import { protect } from '../../middlewares/protect.js';
import { userOnly } from '../../middlewares/userOnly.js';

const router = express.Router();

// Feed (home)
router.get('/feed', protect, userOnly, PostCtrl.getHomeFeed);

// Create
router.post('/', protect, userOnly, PostCtrl.createPost);

// Get user's posts
router.get('/user', protect, userOnly, PostCtrl.getUserPosts);

// Post detail
router.get('/:id', protect, PostCtrl.getPostDetail);

// Update (owner or admin check in controller)
router.put('/:id', protect, PostCtrl.updatePost);

// Delete (soft)
router.delete('/:id', protect, PostCtrl.deletePost);

// Like / Unlike
router.post('/:id/like', protect, userOnly, PostCtrl.likePost);
router.post('/:id/unlike', protect, userOnly, PostCtrl.unlikePost);

// Comments
router.post('/:id/comments', protect, userOnly, PostCtrl.commentOnPost);
router.get('/:id/comments', protect, PostCtrl.getPostComments);

// Open / create 1:1 conversation with post author (when clicking avatar)
router.post('/:id/message', protect, userOnly, PostCtrl.openConversationWithAuthor);

export default router;
