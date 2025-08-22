// src/controllers/user/post.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import { Post } from '../../models/post.model.js';
import { Comment } from '../../models/comment.model.js';
import type { AuthRequest } from '../../middlewares/types.js';

/**
 * Feed (home) - show posts created by admin (approved) in instagram-like feed
 * Query:
 *  - page, limit
 *  - q: optional text search in content
 */
export const getHomeFeed = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('q').optional().trim().isString(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(50, Number(req.query.limit || 12));
      const q = (req.query.q as string | undefined) || undefined;
      const skip = (page - 1) * limit;

      // Only show posts that are approved and authored by admin (for "home" feed)
      const filter: any = { isDeleted: false, isApproved: true };

      // populate admin authored posts: we require author.role === 'admin'
      if (q) {
        filter.content = { $regex: q, $options: 'i' };
      }

      // Find posts and join author; then filter by author.role==='admin' via populate + in-memory filter
      // For efficiency in prod you may want aggregated join with $lookup and $match on author.role
      const posts = await Post.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name avatar role')
        .lean();

      // Only include posts whose author is admin
      const adminPosts = posts.filter((p: any) => p.author && p.author.role === 'admin');

      // Map to feed DTO: include whether current user liked, likeCount, replyCount, preview image
      const userId = req.user?._id;
      const mapped = adminPosts.map((p: any) => ({
        _id: p._id,
        content: p.content,
        images: Array.isArray(p.images) ? p.images : [],
        previewImage: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null,
        author: p.author ? { _id: p.author._id, name: p.author.name, avatar: p.author.avatar } : null,
        createdAt: p.createdAt,
        likeCount: typeof p.likeCount === 'number' ? p.likeCount : (Array.isArray(p.likes) ? p.likes.length : 0),
        hasLiked: userId ? (Array.isArray(p.likes) ? p.likes.some((id: any) => String(id) === String(userId)) : false) : false,
        commentCount: p.replyCount ?? undefined, // virtual if available; else will be undefined
      }));

      // total count (approx) - count only approved posts whose author is admin
      // For accurate total you'd need aggregation matching author.role === 'admin' via $lookup.
      const totalApprox = await Post.countDocuments({ isApproved: true, isDeleted: false });

      return res.json({ posts: mapped, page, limit, totalApprox });
    } catch (err) {
      console.error('Get home feed error:', err);
      next(err);
    }
  },
];

/**
 * Create post (user)
 * - body: content (opt), images: array (0-6), product optional
 */
export const createPostValidation = [
  body('content').optional().trim().isLength({ max: 2000 }).withMessage('Nội dung tối đa 2000 ký tự'),
  body('images').optional().isArray({ max: 6 }).withMessage('Tối đa 6 ảnh'),
  body('images.*').optional().isString(),
  body('product').optional().isMongoId(),
];

export const createPost = [
  ...createPostValidation,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const postData: any = {
        content: req.body.content || '',
        images: Array.isArray(req.body.images) ? req.body.images.slice(0, 6) : [],
        author: new Types.ObjectId(user._id),
        product: req.body.product ? new Types.ObjectId(req.body.product) : null,
        // isApproved default is false in schema; admin posts get auto-approved in pre-save
      };

      const created = await Post.create(postData);
      return res.status(201).json({ message: 'Tạo bài thành công', post: created });
    } catch (err) {
      console.error('Create post error:', err);
      next(err);
    }
  },
];

/**
 * Delete post (only owner or admin)
 */
export const deletePost = [
  param('id').isMongoId(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ message: 'Không tìm thấy bài' });

      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      // allow owner or admin
      if (String(post.author) !== String(user._id) && user.role !== 'admin') {
        return res.status(403).json({ message: 'Bạn không có quyền xóa bài viết này' });
      }

      // soft delete via isDeleted if present, else remove
      if (typeof (post as any).isDeleted !== 'undefined') {
        (post as any).isDeleted = true;
        await post.save();
      } else {
        await post.remove();
      }
      return res.json({ message: 'Xóa bài thành công' });
    } catch (err) {
      console.error('Delete post error:', err);
      next(err);
    }
  },
];

/**
 * Like a post
 */
export const likePost = [
  param('id').isMongoId(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ message: 'Không tìm thấy bài' });

      await post.like(new Types.ObjectId(user._id));
      return res.json({ message: 'Đã thích bài' });
    } catch (err) {
      console.error('Like post error:', err);
      next(err);
    }
  },
];

/**
 * Unlike a post
 */
export const unlikePost = [
  param('id').isMongoId(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ message: 'Không tìm thấy bài' });

      await post.unlike(new Types.ObjectId(user._id));
      return res.json({ message: 'Bỏ thích thành công' });
    } catch (err) {
      console.error('Unlike post error:', err);
      next(err);
    }
  },
];

/**
 * Create comment on post
 * body: content (required)
 */
export const commentOnPost = [
  param('id').isMongoId(),
  body('content').trim().isLength({ min: 1 }).withMessage('Nội dung bình luận không được rỗng'),
  body('parent').optional().isMongoId(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ message: 'Không tìm thấy bài' });

      const commentDoc = await Comment.create({
        content: req.body.content,
        author: new Types.ObjectId(user._id),
        post: post._id,
        parent: req.body.parent ? new Types.ObjectId(req.body.parent) : null,
      });

      return res.status(201).json({ message: 'Đã bình luận', comment: commentDoc });
    } catch (err) {
      console.error('Comment on post error:', err);
      next(err);
    }
  },
];

/**
 * Get comments for a post (paginate)
 */
export const getPostComments = [
  param('id').isMongoId(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(50, Number(req.query.limit || 20));
      const skip = (page - 1) * limit;

      const postId = req.params.id;
      const comments = await Comment.find({ post: postId, isDeleted: { $ne: true } })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name avatar')
        .lean();

      const total = await Comment.countDocuments({ post: postId, isDeleted: { $ne: true } });

      return res.json({ comments, page, limit, total });
    } catch (err) {
      console.error('Get post comments error:', err);
      next(err);
    }
  },
];
