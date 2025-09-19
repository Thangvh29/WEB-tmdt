// controllers/post.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Post } from '../../models/post.model.js';
import { User } from '../../models/user.model.js';
import { Comment } from '../../models/comment.model.js';
import type { AuthRequest } from '../../middlewares/types.js';
import mongoose, { Types } from 'mongoose';

// Helpers
const badReq = (res: Response, errors: any) => res.status(400).json({ errors: errors.array ? errors.array() : errors });

// Role check helper
function requireRole(user: any, roles: string[]) {
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Validation
 * - create: content optional, images 1..6 (admin feed requires images according to your UI)
 * - update: images optional
 */
export const createPostValidation = [
  body('content').optional().trim().isLength({ max: 2000 }).withMessage('Nội dung không được vượt quá 2000 ký tự'),
  body('images').isArray({ min: 1, max: 6 }).withMessage('Hình ảnh phải từ 1 đến 6 URL'),
  body('images.*').isString().withMessage('Mỗi ảnh phải là URL/string'),
  body('product').optional().isMongoId().withMessage('product phải là ObjectId'),
];

export const updatePostValidation = [
  body('content').optional().trim().isLength({ max: 2000 }).withMessage('Nội dung không được vượt quá 2000 ký tự'),
  body('images').optional().isArray({ min: 0, max: 6 }).withMessage('Hình ảnh phải từ 0 đến 6 URL'),
  body('images.*').optional().isString(),
  body('product').optional().isMongoId().withMessage('product phải là ObjectId'),
];

export const moderatePostValidation = [
  body('isApproved').isBoolean().withMessage('isApproved phải là boolean'),
];

// src/controllers/post.controller.ts
export const createPost = async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;
    const files = req.files as Express.Multer.File[];

    const imagePaths = files ? files.map((file) => `/uploads/posts/${file.filename}`) : [];

    const post = await Post.create({
      title,
      content,
      images: imagePaths,
    });

    res.status(201).json({ success: true, post });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error creating post" });
  }
};
// Get feed for home page (user sees admin posts + approved user posts)
export const getFeed = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
  query('q').optional().trim(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);
    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(50, Number(req.query.limit || 10));
      const q = (req.query.q as string | undefined) || undefined;

      const filter: any = { isDeleted: false, isApproved: true };
      // admin posts should also show — included because isApproved true for admins
      if (q) filter.$text = { $search: q };

      const posts = await Post.find(filter)
        .populate('author', 'name avatar role')
        .select('content images author createdAt views isApproved') // projection for card
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      const total = await Post.countDocuments(filter);
      return res.json({ posts, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err) {
      console.error('Get feed error:', err);
      next(err);
    }
  },
];

// Get posts by user (for admin management or user's own posts)
export const getUserPosts = [
  query('userId').optional().isMongoId(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);
    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(50, Number(req.query.limit || 10));
      const userId = req.query.userId ? String(req.query.userId) : (req.user?._id ? String(req.user._id) : undefined);

      if (!userId) return res.status(400).json({ message: 'userId required' });

      const filter: any = { author: userId, isDeleted: false };
      const posts = await Post.find(filter)
        .populate('author', 'name avatar role')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      const total = await Post.countDocuments(filter);
      return res.json({ posts, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err) {
      console.error('Get user posts error:', err);
      next(err);
    }
  },
];

// Get post detail with comments (top-level + replies)
export const getPostDetail = [
  param('id').isMongoId(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);
    try {
      const post = await Post.findById(req.params.id).populate('author', 'name avatar role').lean();
      if (!post || post.isDeleted) return res.status(404).json({ message: 'Không tìm thấy bài đăng' });

      // increase view count (async, best-effort)
      Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).exec();

      // load top-level comments + replies
      const topComments = await Comment.find({ post: post._id, parent: null, isDeleted: { $ne: true }, isApproved: true })
        .populate('author', 'name avatar')
        .sort({ createdAt: -1 })
        .lean();

      const parentIds = topComments.map(c => c._id);
      const replies = await Comment.find({ parent: { $in: parentIds }, isDeleted: { $ne: true } })
        .populate('author', 'name avatar')
        .sort({ createdAt: 1 })
        .lean();

      const repliesByParent = replies.reduce<Record<string, any[]>>((acc, r) => {
        const pid = String(r.parent);
        if (!acc[pid]) acc[pid] = [];
        acc[pid].push(r);
        return acc;
      }, {});

      const commentsWithReplies = topComments.map(c => ({ ...c, replies: repliesByParent[String(c._id)] || [] }));

      return res.json({ post, comments: commentsWithReplies });
    } catch (err) {
      console.error('Get post detail error:', err);
      next(err);
    }
  },
];

// Update post (author or admin)
export const updatePost = [
  param('id').isMongoId(),
  ...updatePostValidation,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const post = await Post.findById(req.params.id);
      if (!post || post.isDeleted) return res.status(404).json({ message: 'Không tìm thấy bài đăng' });

      // Only author or admin can edit
      if (!post.author.equals(user._id) && user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

      // apply updates (but don't let normal user auto-approve)
      if (req.body.content !== undefined) post.content = req.body.content;
      if (req.body.images !== undefined) post.images = req.body.images;
      if (req.body.product !== undefined) post.product = req.body.product;

      // if non-admin edits, set isApproved false to require re-moderation (opt-in)
      if (user.role !== 'admin') post.isApproved = false;

      await post.save();
      return res.json({ message: 'Cập nhật bài đăng thành công', post });
    } catch (err) {
      console.error('Update post error:', err);
      next(err);
    }
  },
];

// Soft delete post (author or admin)
export const deletePost = [
  param('id').isMongoId(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ message: 'Không tìm thấy bài đăng' });

      if (!post.author.equals(user._id) && user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

      await post.softDelete();
      return res.json({ message: 'Xóa bài đăng thành công' });
    } catch (err) {
      console.error('Delete post error:', err);
      next(err);
    }
  },
];

// Moderate post (admin)
export const moderatePost = [
  param('id').isMongoId(),
  ...moderatePostValidation,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);
    try {
      const user = req.user;
      if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ message: 'Không tìm thấy bài đăng' });

      post.isApproved = req.body.isApproved;
      await post.save();
      return res.json({ message: 'Cập nhật trạng thái bài đăng thành công', post });
    } catch (err) {
      console.error('Moderate post error:', err);
      next(err);
    }
  },
];

// Like / Unlike
export const likePost = [
  param('id').isMongoId(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const post = await Post.findById(req.params.id);
      if (!post || post.isDeleted) return res.status(404).json({ message: 'Không tìm thấy bài đăng' });

      await post.like(new Types.ObjectId(user._id));
      return res.json({ message: 'Liked', likeCount: post.likeCount });
    } catch (err) {
      console.error('Like post error:', err);
      next(err);
    }
  },
];

export const unlikePost = [
  param('id').isMongoId(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const post = await Post.findById(req.params.id);
      if (!post || post.isDeleted) return res.status(404).json({ message: 'Không tìm thấy bài đăng' });

      await post.unlike(new Types.ObjectId(user._id));
      return res.json({ message: 'Unliked', likeCount: post.likeCount });
    } catch (err) {
      console.error('Unlike post error:', err);
      next(err);
    }
  },
];
