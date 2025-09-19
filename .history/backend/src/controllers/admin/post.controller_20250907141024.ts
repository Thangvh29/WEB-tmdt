// controllers/admin/post.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Post } from '../../models/post.model.js';
import { User } from '../../models/user.model.js';
import { Comment } from '../../models/comment.model.js';
import { Conversation } from '../../models/conversation.model.js';
import type { AuthRequest } from '../../middlewares/types.js';
import mongoose, { Types } from 'mongoose';

// Helper: convert relative paths to absolute URLs
function normalizePost(post: any, req: Request) {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  return {
    ...post.toObject?.() || post,
    images: (post.images || []).map((img: string) =>
      img.startsWith("http") ? img : `${baseUrl}${img}`
    ),
    author: post.author
      ? {
          ...post.author,
          avatar: post.author.avatar
            ? (post.author.avatar.startsWith("http")
                ? post.author.avatar
                : `${baseUrl}${post.author.avatar}`)
            : null,
        }
      : null,
  };
}

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
  body('content')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Nội dung không được vượt quá 2000 ký tự'),
  body('images')
    .optional()
    .isArray({ min: 1, max: 6 })
    .withMessage('Hình ảnh phải từ 1 đến 6 URL'),
  body('images.*').optional().isString(),
  body('product').optional().isMongoId().withMessage('product phải là ObjectId'),
];

export const updatePostValidation = [
  body('content')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Nội dung không được vượt quá 2000 ký tự'),
  body('images')
    .optional()
    .isArray({ min: 0, max: 6 })
    .withMessage('Hình ảnh phải từ 0 đến 6 URL'),
  body('images.*').optional().isString(),
  body('product').optional().isMongoId().withMessage('product phải là ObjectId'),
];

export const moderatePostValidation = [
  body('isApproved').isBoolean().withMessage('isApproved phải là boolean'),
];

// ✅ FIXED: Sử dụng đường dẫn nhất quán với multer config
export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const newPost = new Post({
      author: req.user._id,
      content: req.body.content,
      images: req.files
        ? (req.files as Express.Multer.File[]).map(
            (f) => "/uploads/posts/" + f.filename
          )
        : [],
    });

    const savedPost = await newPost.save();
    const populated = await savedPost.populate("author", "name avatar role");

    res.json({ success: true, post: normalizePost(populated, req) });
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// ✅ FIXED: Update post cũng cần sử dụng đường dẫn đúng
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
      if (!post || post.isDeleted)
        return res.status(404).json({ message: 'Không tìm thấy bài đăng' });

      // Only author or admin can edit
      if (!post.author.equals(user._id) && user.role !== 'admin')
        return res.status(403).json({ message: 'Forbidden' });

      // Files upload mới (append vào images cũ)
      const files = req.files as Express.Multer.File[];
      const newImagePaths = files
        ? files.map(
            (file) =>
              `${req.protocol}://${req.get('host')}/uploads/posts/${file.filename}`
          )
        : [];

      // apply updates
      if (req.body.content !== undefined) post.content = req.body.content;
      if (req.body.images !== undefined)
        post.images = req.body.images; // nếu FE gửi URL sẵn
      if (newImagePaths.length > 0) {
        post.images = [...post.images, ...newImagePaths];
      }
      if (req.body.product !== undefined) post.product = req.body.product;

      // nếu không phải admin → cần duyệt lại
      if (user.role !== 'admin') post.isApproved = false;

      await post.save();
      return res.json({ message: 'Cập nhật bài đăng thành công', post });
    } catch (err) {
      console.error('Update post error:', err);
      next(err);
    }
  },
];

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
      if (q) filter.$text = { $search: q };

      const posts = await Post.find(filter)
        .populate('author', 'name avatar role')
        .select('content images author createdAt views isApproved')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const normalized = posts.map((p) => normalizePost(p, req));

      const total = await Post.countDocuments(filter);
      return res.json({
        posts: normalized,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
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
      const userId = req.query.userId
        ? String(req.query.userId)
        : (req.user?._id ? String(req.user._id) : undefined);

      if (!userId)
        return res.status(400).json({ message: 'userId required' });

      const filter: any = { author: userId, isDeleted: false };

      const posts = await Post.find(filter)
        .populate('author', 'name avatar role')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const normalized = posts.map((p) => normalizePost(p, req));

      const total = await Post.countDocuments(filter);
      return res.json({
        posts: normalized,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
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
      const post = await Post.findById(req.params.id)
        .populate('author', 'name avatar role');

      if (!post || post.isDeleted)
        return res.status(404).json({ message: 'Không tìm thấy bài đăng' });

      const normalizedPost = normalizePost(post, req);

      // increase view count (async, best-effort)
      Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).exec();

      // load top-level comments + replies
      const topComments = await Comment.find({
        post: post._id,
        parent: null,
        isDeleted: { $ne: true },
        isApproved: true,
      })
        .populate('author', 'name avatar')
        .sort({ createdAt: -1 })
        .lean();

      const parentIds = topComments.map((c) => c._id);
      const replies = await Comment.find({
        parent: { $in: parentIds },
        isDeleted: { $ne: true },
      })
        .populate('author', 'name avatar')
        .sort({ createdAt: 1 })
        .lean();

      const repliesByParent = replies.reduce<Record<string, any[]>>(
        (acc, r) => {
          const pid = String(r.parent);
          if (!acc[pid]) acc[pid] = [];
          acc[pid].push(r);
          return acc;
        },
        {}
      );

      const commentsWithReplies = topComments.map((c) => ({
        ...c,
        replies: repliesByParent[String(c._id)] || [],
      }));

      return res.json({ post: normalizedPost, comments: commentsWithReplies });
    } catch (err) {
      console.error('Get post detail error:', err);
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
/**
 * POST /api/admin/posts/:id/message
 * Admin mở hoặc tạo conversation 1:1 với tác giả bài viết (user).
 */
export const openConversationWithAuthor = [
  param('id').isMongoId(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const user = req.user;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const postId = req.params.id;
      const post = await Post.findById(postId).select('author').lean().exec();
      if (!post) return res.status(404).json({ message: 'Không tìm thấy bài viết' });

      const authorId = String(post.author);
      const adminId = String(user._id);

      if (authorId === adminId) {
        return res.status(400).json({ message: 'Không thể nhắn tin với chính mình' });
      }

      const sorted = [authorId, adminId].sort().join('_');

      let conv = await Conversation.findOne({ participantsKey: sorted, isGroup: false }).exec();
      if (!conv) {
        conv = await Conversation.create({
          participants: [new Types.ObjectId(authorId), new Types.ObjectId(adminId)],
          isGroup: false,
          participantsKey: sorted,
        });
      }

      return res.json({ conversationId: conv._id });
    } catch (err) {
      console.error('Admin open conversation error:', err);
      next(err);
    }
  },
];
