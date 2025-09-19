// src/controllers/user/post.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import { Post } from '../../models/post.model.js';
import { Comment } from '../../models/comment.model.js';
import { Conversation } from '../../models/conversation.model.js';
import type { AuthRequest } from '../../middlewares/types.js';

function buildFileURL(req: Request, path?: string | null, type: 'avatar' | 'post' = 'post') {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/uploads/')) {
    return `${req.protocol}://${req.get('host')}${path}`;
  }
  return `${req.protocol}://${req.get('host')}/uploads/${type}/${path}`;
}

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

      const posts = await Post.find({ isApproved: true, isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name avatar role')
        .lean()
        .exec();

      const total = await Post.countDocuments({ isApproved: true, isDeleted: { $ne: true } }).exec();
      const userId = (req.user as any)?._id?.toString();

      const enriched = posts.map((p: any) => ({
        ...p,
        author: {
          ...p.author,
          avatar: buildFileURL(req, p.author?.avatar, 'avatar'),
        },
        images: (p.images || []).map((img: string) => buildFileURL(req, img, 'post')),
        likedByMe: userId ? (p.likes || []).some((id: any) => String(id) === userId) : false,
        likeCount: (p.likes || []).length,
      }));

      return res.json({ posts: enriched, total, page, limit });
    } catch (err) {
      console.error('Get feed error:', err);
      next(err);
    }
  },
];

/**
 * GET home feed for users (slightly richer than getFeed)
 * - returns approved posts + basic pagination and whether current user liked each post
 */
export const getHomeFeed = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(30, Number(req.query.limit || 12));
      const skip = (page - 1) * limit;

      const posts = await Post.find({
        isApproved: true,
        isDeleted: { $ne: true },
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        // ✅ populate cả role
        .populate('author', 'name avatar role')
        .lean()
        .exec();

      const total = await Post.countDocuments({
        isApproved: true,
        isDeleted: { $ne: true },
      }).exec();

      const userId = (req.user as any)?._id
        ? String((req.user as any)._id)
        : undefined;

      const enriched = posts.map((p: any) => ({
        ...p,
        likedByMe: userId
          ? (p.likes || []).some((id: any) => String(id) === userId)
          : false,
        likeCount: (p.likes || []).length,
      }));

      return res.json({ posts: enriched, total, page, limit });
    } catch (err) {
      console.error('Get home feed error:', err);
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

      if (images.length > 6) return res.status(400).json({ message: 'Không được quá 6 ảnh' });

      const authorId = (user as any)._id ? (user as any)._id : (user as any).id ?? (user as any)._id;

      const doc = await Post.create({
        content,
        images,
        author: new Types.ObjectId(String(authorId)),
        product: product || null,
        isApproved: true,
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
export const getPostDetail = [ param('id').isMongoId(), async (req: AuthRequest, res: Response, next: NextFunction) => { const errors = validationResult(req); if (!errors.isEmpty()) return badReq(res, errors); try { const id = req.params.id; const post = await Post.findById(id).populate('author', 'name avatar').lean().exec(); if (!post || post.isDeleted) return res.status(404).json({ message: 'Không tìm thấy bài viết' }); // increment views (non-blocking) Post.findByIdAndUpdate(id, { $inc: { views: 1 } }).exec().catch(() => { /* ignore */ }); return res.json({ post }); } catch (err) { console.error('Get post detail error:', err); next(err); } }, ];

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
      const post = await Post.findById(id)
        .populate('author', 'name avatar role')
        .lean()
        .exec();

      if (!post || post.isDeleted) return res.status(404).json({ message: 'Không tìm thấy bài viết' });

      // normalize
      const enriched = {
        ...post,
        author: {
          ...post.author,
          avatar: buildFileURL(req, post.author?.avatar, 'avatar'),
        },
        images: (post.images || []).map((img: string) => buildFileURL(req, img, 'post')),
      };

      // increment views (non-blocking)
      Post.findByIdAndUpdate(id, { $inc: { views: 1 } }).exec().catch(() => {});

      return res.json({ post: enriched });
    } catch (err) {
      console.error('Get post detail error:', err);
      next(err);
    }
  },
];

/**
 * PUT /user/posts/:id
 * Update post (only owner or admin allowed)
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

      const userId = (user as any)._id ? String((user as any)._id) : String((user as any).id ?? (user as any)._id);
      if (!post.author.equals(new Types.ObjectId(userId)) && (user as any).role !== 'admin') {
        return res.status(403).json({ message: 'Bạn không có quyền sửa bài viết này' });
      }

      if (req.body.content !== undefined) post.content = String(req.body.content).trim();
      if (req.body.images !== undefined) {
        const images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
        post.images = images.slice(0, 6);
      }

      // Editing a post may require re-approval depending on policy
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

      const userId = (user as any)._id ? String((user as any)._id) : String((user as any).id ?? (user as any)._id);
      if (!post.author.equals(new Types.ObjectId(userId)) && (user as any).role !== 'admin') {
        return res.status(403).json({ message: 'Bạn không có quyền xóa bài viết này' });
      }

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

      const userId = (user as any)._id ? new Types.ObjectId((user as any)._id) : new Types.ObjectId(String(user._id));
      const updated = await Post.findByIdAndUpdate(id, { $addToSet: { likes: userId } }, { new: true }).exec();

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
      const userId = (user as any)._id ? new Types.ObjectId((user as any)._id) : new Types.ObjectId(String(user._id));

      const updated = await Post.findByIdAndUpdate(id, { $pull: { likes: userId } }, { new: true }).exec();
      if (!updated || updated.isDeleted) return res.status(404).json({ message: 'Không tìm thấy bài viết' });

      return res.json({ message: 'Bỏ thích thành công', likeCount: updated.likes.length });
    } catch (err) {
      console.error('Unlike post error:', err);
      next(err);
    }
  },
];

/**
 * POST /user/posts/:id/comments - add comment or reply
 * body: { content, rating?: number, parent?: commentId }
 */
export const commentOnPost = [
  param('id').isMongoId(),
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Nội dung bình luận required (1-2000)'),
  body('rating').optional().isInt({ min: 1, max: 5 }).toInt(),
  body('parent').optional().isMongoId(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const postId = req.params.id;
      const content: string = String(req.body.content || '').trim();
      const rating: number | null = req.body.rating != null ? Number(req.body.rating) : null;
      const parentId: string | undefined = req.body.parent;

      // verify post exists and not deleted
      const post = await Post.findById(postId).exec();
      if (!post || post.isDeleted) return res.status(404).json({ message: 'Không tìm thấy bài viết' });

      // If rating provided, ensure post is associated with a product (policy)
      if (rating !== null && !post.product) {
        return res.status(400).json({ message: 'Rating chỉ áp dụng cho bài viết liên quan tới sản phẩm' });
      }

      // if parent provided, ensure parent exists
      let parentRef: Types.ObjectId | null = null;
      if (parentId) {
        const parent = await Comment.findById(parentId).exec();
        if (!parent) return res.status(404).json({ message: 'Không tìm thấy comment parent' });
        parentRef = parent._id as Types.ObjectId;
      }

      const authorId = (user as any)._id ? new Types.ObjectId((user as any)._id) : new Types.ObjectId(String(user._id));

      const newComment = await Comment.create({
        content,
        author: authorId,
        post: post._id,
        product: null,
        parent: parentRef,
        rating: rating !== null ? rating : null,
        isApproved: true,
      });

      return res.status(201).json({ message: 'Bình luận thành công', comment: newComment });
    } catch (err) {
      console.error('Comment on post error:', err);
      next(err);
    }
  },
];

/**
 * GET comments for a post (paginated, option to include replies)
 */
export const getPostComments = [
  param('id').isMongoId(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const postId = req.params.id;
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(100, Number(req.query.limit || 20));
      const skip = (page - 1) * limit;

      const filter: any = { post: postId, isDeleted: { $ne: true }, isApproved: true, parent: null };

      const [comments, total] = await Promise.all([
        Comment.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('author', 'name avatar')
          .lean()
          .exec(),
        Comment.countDocuments(filter).exec(),
      ]);

      const topIds = comments.map((c: any) => c._id);
      const replies = topIds.length > 0
        ? await Comment.find({ parent: { $in: topIds }, isDeleted: { $ne: true }, isApproved: true })
            .sort({ createdAt: 1 })
            .populate('author', 'name avatar')
            .lean()
            .exec()
        : [];

      const groupedReplies: Record<string, any[]> = {};
      for (const r of replies) {
        const pid = String(r.parent);
        if (!groupedReplies[pid]) groupedReplies[pid] = [];
        groupedReplies[pid].push(r);
      }

      const mapped = comments.map((c: any) => ({ ...c, replies: groupedReplies[String(c._id)] || [] }));

      return res.json({ comments: mapped, total, page, limit });
    } catch (err) {
      console.error('Get post comments error:', err);
      next(err);
    }
  },
];
/**
 * POST /api/user/posts/:id/message
 * Open or create a 1:1 conversation between current user and post author.
 * Returns { conversationId } that frontend can use to open messenger.
 */
export const openConversationWithAuthor = [
  param('id').isMongoId(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const postId = req.params.id;
      const post = await Post.findById(postId).select('author').lean().exec();
      if (!post) return res.status(404).json({ message: 'Không tìm thấy bài viết' });

      const authorId = String(post.author);
      const requesterId = String((user as any)._id ?? user._id);

      if (authorId === requesterId) {
        return res.status(400).json({ message: 'Không thể nhắn tin với chính mình' });
      }

      // participantsKey (sorted) ensures unique 1:1 conversation
      const sorted = [authorId, requesterId].sort().join('_');

      // Find existing 1:1 conversation
      let conv = await Conversation.findOne({ participantsKey: sorted, isGroup: false }).exec();

      if (!conv) {
        conv = await Conversation.create({
          participants: [new Types.ObjectId(authorId), new Types.ObjectId(requesterId)],
          isGroup: false,
          participantsKey: sorted,
        });
      }

      return res.json({ conversationId: conv._id });
    } catch (err) {
      console.error('Open conversation error:', err);
      next(err);
    }
  },
];
export const getUserOnlyFeed = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return badReq(res, errors);

    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(30, Number(req.query.limit || 12));
      const skip = (page - 1) * limit;

      // Lấy post đã duyệt, chưa xoá
      const posts = await Post.find({
        isApproved: true,
        isDeleted: { $ne: true },
      })
        .populate("author", "name avatar role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();

      // ✅ Lọc chỉ post của user
      const userPosts = posts.filter((p: any) => p.author?.role === "user");

      // ✅ Đếm tổng chính xác số post của user
      const total = await Post.countDocuments({
        isApproved: true,
        isDeleted: { $ne: true },
      })
        .populate("author", "role")
        .then((all) => all); // bạn có thể thay bằng aggregate để lọc role=user ngay từ DB

      const userId = req.user?._id?.toString();
      const enriched = userPosts.map((p: any) => ({
        ...p,
        likedByMe: userId
          ? (p.likes || []).some((id: any) => String(id) === userId)
          : false,
        likeCount: (p.likes || []).length,
      }));

      return res.json({
        posts: enriched,
        total: enriched.length, // ⚡ sửa: chỉ trả đúng số bài user
        page,
        limit,
        totalPages: Math.ceil(enriched.length / limit),
      });
    } catch (err) {
      console.error("Get user-only feed error:", err);
      next(err);
    }
  },
];

