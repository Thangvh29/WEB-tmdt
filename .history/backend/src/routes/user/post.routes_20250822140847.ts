// src/routes/user/post.routes.ts
import express from 'express';
import * as PostCtrl from '../../controllers/user/post.controller.js';
import { isAuth } from '../../middlewares/auth.js';
import { userOnly } from '../../middlewares/userOnly.js';

const router = express.Router();

// Home feed (admin posts only) - authenticated users so we can show hasLiked flag, etc.
// If you want public feed, remove isAuth middleware here.
router.get('/feed', isAuth, PostCtrl.getHomeFeed);

// Create a post - only 'user' role allowed
router.post('/', isAuth, userOnly, PostCtrl.createPost);

// Delete post - allow owner or admin (controller enforces)
router.delete('/:id', isAuth, PostCtrl.deletePost);

// Like / unlike - typically only users should like; use userOnly
router.post('/:id/like', isAuth, userOnly, PostCtrl.likePost);
router.post('/:id/unlike', isAuth, userOnly, PostCtrl.unlikePost);

// Comments (create by users, listing public/authenticated)
router.post('/:id/comments', isAuth, userOnly, PostCtrl.commentOnPost);
router.get('/:id/comments', PostCtrl.getPostComments);

export default router;
