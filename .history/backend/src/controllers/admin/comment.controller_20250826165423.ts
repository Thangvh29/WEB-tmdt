// controllers/comment.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import mongoose, { Types } from 'mongoose';
import { Comment } from '../../models/comment.model.js';
import { Post } from '../../models/post.model.js';
import { Product } from '../../models/product.model.js';
import type { AuthRequest } from '../../middlewares/types.js';

const badReq = (res: Response, errors: any) => res.status(400).json({ errors: errors.array ? errors.array() : errors });

// Create comment on post or product (or reply)
export const createComment = [
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Nội dung bắt buộc'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const { content, product, parent } = req.body;
      const post = req.body.post || req.params.postId; // 👈 lấy từ params nếu có

      if (parent) {
        const parentComment = await Comment.findById(parent).lean();
        if (!parentComment) return res.status(404).json({ message: 'Parent comment not found' });
      }

      if (post) {
        const p = await Post.findById(post).lean();
        if (!p) return res.status(404).json({ message: 'Post not found' });
      }

      const c = new Comment({
        content,
        author: user._id,
        post: post || null,
        product: product || null,
        parent: parent || null,
      });

      await c.save();
      await c.populate('author', 'name avatar');

      return res.status(201).json({ message: 'Thêm bình luận thành công', comment: c });
    } catch (err) {
      console.error('Create comment error:', err);
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
