// src/controllers/user/post.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import { Post } from '../../models/post.model.js';
import type { AuthRequest } from '../../middlewares/types.js';

/**
 * Helpers
 */
const badReq = (res: Response, errors: any) => res.status(400).json({ errors: errors.array ? errors.array() : errors });

/**
 * GET /user/posts/feed
 * Return feed of approved posts (paginated) — public to authenticated users
 */
export const getFeed = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(30, Number(req.query.limit || 12));
      const skip = (page - 1) * limit;

      // Only approved and not soft-deleted posts show in feed
      const posts = await Post.find({ isApproved: true, isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name avatar')
        .lean()
        .exec();

      const total = await Post.countDocuments({ isApproved: true, isDeleted: { $ne: true } }).exec();

      return res.json({ posts, total, page, limit });
    } catch (err) {
      console.error('Get feed error:', err);
      next(err);
    }
  },
];

/**
 * POST /user/posts
 * Create a new post (user can attach images via multipart; images already uploaded by multer)
 * Body: { content?: string, images?: string[], product?: productId }
 */
export const createPost = [
  body('content').optional().trim().isLength({ max: 2000 }).withMessage('Nội dung không vượt quá 2000 ký tự'),
  body('images').optional().isArray({ max: 6 }).withMessage('Images must be array up to 6'),
  body('product').optional().isMongoId(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const content = (req.body.content || '').trim();
      const images = Array.isArray(req.body.images) ? req.body.images : (req.body.images ? [req.body.images] : []);
      const product = req.body.product ? new Types.ObjectId(String(req.body.product)) : undefined;

      // minimal validation: images length <= 6
      if (images.length > 6) return res.status(400).json({ message: 'Không được quá 6 ảnh' });

      const doc = await Post.create({
        content,
        images,
        author: (user as any)._id ? (user as any)._id : user._id,
        product: product || null,
        isApproved: false, // by default require admin approval unless logic elsewhere
      });

      return res.status(201).json({ message: 'Đăng bài thành công', post: doc });
    } catch (err) {
      console.error('Create post error:', err);
      next(err);
    }
  },
];

/**
 * GET /user/posts/user
 * Get posts of the current user (including unapproved/drafts)
 */
export const getUserPosts = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(50, Number(req.query.limit || 12));
      const skip = (page - 1) * limit;

      const posts = await Post.find({ author: (user as any)._id ? (user as any)._id : user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();

      const total = await Post.countDocuments({ author: (user as any)._id ? (user as any)._id : user._id }).exec();

      return res.json({ posts, total, page, limit });
    } catch (err) {
      console.error('Get user posts error:', err);
      next(err);
    }
  },
];

/**
 * GET /user/posts/:id
 */
export const getPostDetail = [
  param('id').isMongoId(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const id = req.params.id;
      const post = await Post.findById(id).populate('author', 'name avatar').lean().exec();
      if (!post || post.isDeleted) return res.status(404).json({ message: 'Không tìm thấy bài viết' });

      // increment views (non-blocking)
      try {
        await Post.findByIdAndUpdate(id, { $inc: { views: 1 } }).exec();
      } catch (e) {
        // ignore
      }

      return res.json({ post });
    } catch (err) {
      console.error('Get post detail error:', err);
      next(err);
    }
  },
];

/**
 * PUT /user/posts/:id
 * Update post (only owner or admin allowed — here we assume protect middleware has set req.user and adminOnly used in admin routes)
 */
export const updatePost = [
  param('id').isMongoId(),
  body('content').optional().trim().isLength({ max: 2000 }),
  body('images').optional().isArray({ max: 6 }),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const id = req.params.id;
      const post = await Post.findById(id).exec();
      if (!post || post.isDeleted) return res.status(404).json({ message: 'Không tìm thấy bài viết' });

      // Only owner (or admin - admin path should use adminOnly middleware). If req.user is a full User doc, compare _id
      const userId = (user as any)._id ?? (user as any).id ?? user._id;
      if (!post.author.equals(userId) && (user as any).role !== 'admin') {
        return res.status(403).json({ message: 'Bạn không có quyền sửa bài viết này' });
      }

      if (req.body.content !== undefined) post.content = String(req.body.content).trim();
      if (req.body.images !== undefined) {
        const images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
        post.images = images.slice(0, 6);
      }

      // Editing a post may require re-approval
      post.isApproved = false;

      await post.save();

      return res.json({ message: 'Cập nhật bài viết thành công', post });
    } catch (err) {
      console.error('Update post error:', err);
      next(err);
    }
  },
];

/**
 * DELETE /user/posts/:id
 * Soft-delete by setting isDeleted = true (owner or admin)
 */
export const deletePost = [
  param('id').isMongoId(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const id = req.params.id;
      const post = await Post.findById(id).exec();
      if (!post || post.isDeleted) return res.status(404).json({ message: 'Không tìm thấy bài viết' });

      const userId = (user as any)._id ?? user._id;
      if (!post.author.equals(userId) && (user as any).role !== 'admin') {
        return res.status(403).json({ message: 'Bạn không có quyền xóa bài viết này' });
      }

      // Soft delete
      post.isDeleted = true;
      await post.save();

      return res.json({ message: 'Xóa bài viết thành công' });
    } catch (err) {
      console.error('Delete post error:', err);
      next(err);
    }
  },
];

/**
 * POST /user/posts/:id/like
 */
export const likePost = [
  param('id').isMongoId(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      const id = req.params.id;

      // Use atomic update to avoid race
      const userId = (user as any)._id ?? user._id;
      const updated = await Post.findByIdAndUpdate(
        id,
        { $addToSet: { likes: userId } },
        { new: true }
      ).exec();

      if (!updated || updated.isDeleted) return res.status(404).json({ message: 'Không tìm thấy bài viết' });

      return res.json({ message: 'Đã thích bài viết', likeCount: updated.likes.length });
    } catch (err) {
      console.error('Like post error:', err);
      next(err);
    }
  },
];

/**
 * POST /user/posts/:id/unlike
 */
export const unlikePost = [
  param('id').isMongoId(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      const id = req.params.id;
      const userId = (user as any)._id ?? user._id;

      const updated = await Post.findByIdAndUpdate(id, { $pull: { likes: userId } }, { new: true }).exec();
      if (!updated || updated.isDeleted) return res.status(404).json({ message: 'Không tìm thấy bài viết' });

      return res.json({ message: 'Bỏ thích thành công', likeCount: updated.likes.length });
    } catch (err) {
      console.error('Unlike post error:', err);
      next(err);
    }
  },
];
