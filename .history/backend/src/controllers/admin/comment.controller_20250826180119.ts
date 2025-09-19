// controllers/comment.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import mongoose, { Types } from 'mongoose';
import { Comment } from '../../models/comment.model.js';
import { Post } from '../../models/post.model.js';
import { Product } from '../../models/product.model.js';
import type { AuthRequest } from '../../middlewares/types.js';

const badReq = (res: Response, errors: any) => res.status(400).json({ errors: errors.array ? errors.array() : errors });

export const createComment = [
  param('postId').optional().isMongoId().withMessage('postId param không hợp lệ'),
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Nội dung bắt buộc'),
  body('post').optional().isMongoId(),
  body('product').optional().isMongoId(),
  body('parent').optional().isMongoId(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const { content, post: postFromBody, product, parent } = req.body;
      const postFromParam = req.params.postId;
      const postId = postFromBody || postFromParam || null;

      // <-- NEW: enforce at least one reference before creating the model
      if (!postId && !product && !parent) {
        return res.status(400).json({ message: 'Comment phải tham chiếu tới post hoặc product hoặc parent.' });
      }

      // Parent existence check
      if (parent) {
        if (!mongoose.isValidObjectId(parent)) return res.status(400).json({ message: 'parent id không hợp lệ' });
        const parentComment = await Comment.findById(parent).lean();
        if (!parentComment) return res.status(404).json({ message: 'Parent comment not found' });
      }

      // If postId present, validate existence
      if (postId) {
        if (!mongoose.isValidObjectId(postId)) {
          return res.status(400).json({ message: 'postId không hợp lệ' });
        }
        const p = await Post.findById(postId).lean();
        if (!p) return res.status(404).json({ message: 'Post not found' });
      }

      // If product present, validate existence
      if (product) {
        if (!mongoose.isValidObjectId(product)) {
          return res.status(400).json({ message: 'product id không hợp lệ' });
        }
        const pr = await Product.findById(product).lean();
        if (!pr) return res.status(404).json({ message: 'Product not found' });
      }

      const c = new Comment({
        content,
        author: user._id,
        post: postId || null,
        product: product || null,
        parent: parent || null,
      });

      await c.save();
      await c.populate('author', 'name avatar');

      return res.status(201).json({ message: 'Thêm bình luận thành công', comment: c });
    } catch (err: any) {
      console.error('Create comment error:', err && (err.stack || err), err?.message);
      // Nếu vẫn có lỗi từ mongoose, trả 400 nếu có message dễ hiểu
      if (err && (err.name === 'ValidationError' || String(err.message).toLowerCase().includes('comment must reference'))) {
        return res.status(400).json({ message: err.message });
      }
      next(err);
    }
  }
];

// Get comments by post (top-level + replies mapped)
export const getCommentsByPost = [
  param('postId').isMongoId(),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);
    try {
      const postId = req.params.postId;
      // top-level approved & not deleted
      const topComments = await Comment.find({ post: postId, parent: null, isDeleted: false, isApproved: true })
        .populate('author', 'name avatar')
        .sort({ createdAt: -1 })
        .lean();

      const parentIds = topComments.map(c => c._id);
      const replies = await Comment.find({ parent: { $in: parentIds }, isDeleted: false })
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
      return res.json({ comments: commentsWithReplies });
    } catch (err) {
      console.error('Get comments error:', err);
      next(err);
    }
  }
];

// Admin: approve/unapprove comment
export const moderateComment = [
  param('id').isMongoId(),
  body('isApproved').isBoolean(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);
    try {
      const user = req.user;
      if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

      const c = await Comment.findById(req.params.id);
      if (!c) return res.status(404).json({ message: 'Không tìm thấy comment' });

      c.isApproved = Boolean(req.body.isApproved);
      await c.save();
      return res.json({ message: 'Cập nhật trạng thái comment', comment: c });
    } catch (err) {
      console.error('Moderate comment error:', err);
      next(err);
    }
  }
];

// Delete (soft) comment
export const deleteComment = [
  param('id').isMongoId(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const c = await Comment.findById(req.params.id);
      if (!c) return res.status(404).json({ message: 'Không tìm thấy comment' });

      // Only author or admin can delete
      if (!c.author.equals(user._id) && user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

      await c.softDelete();
      return res.json({ message: 'Xóa comment thành công' });
    } catch (err) {
      console.error('Delete comment error:', err);
      next(err);
    }
  }
];
