// controllers/review.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import mongoose, { Types } from 'mongoose';
import { Comment } from '../../models/comment.model.js';

// Validation
export const createReviewValidation = [
  body('product').notEmpty().isMongoId().withMessage('product là ObjectId bắt buộc'),
  body('content').trim().notEmpty().withMessage('Nội dung là bắt buộc'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('rating từ 1 đến 5'),
];

export const replyValidation = [
  body('content').trim().notEmpty().withMessage('Nội dung trả lời là bắt buộc'),
];

export const listReviewsValidation = [
  query('productId').notEmpty().isMongoId().withMessage('productId là bắt buộc'),
  query('status').optional().isIn(['pending', 'approved', 'rejected']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
  query('rating').optional().isInt({ min: 1, max: 5 }).toInt(),
];

// Helper: standard error response for validation
function badRequestValidation(res: Response, errors: any) {
  return res.status(400).json({ errors: errors.array ? errors.array() : errors });
}

// Create review (user)
export const createReview = [
  ...createReviewValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badRequestValidation(res, errors);

    try {
      // req.user assumed set by auth middleware
      const userId = (req as any).user?._id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const { product, content, rating, parent } = req.body;

      // If rating provided but product missing, validation already ensures product present
      const commentData: any = {
        content,
        author: new Types.ObjectId(userId),
        product: new Types.ObjectId(product),
        rating: rating !== undefined ? Number(rating) : null,
        parent: parent ? new Types.ObjectId(parent) : null,
      };

      // If user is admin, you may auto-approve (see your pre-save logic)
      // Save
      const comment = new Comment(commentData);
      await comment.save();

      // Optionally: emit event / update product aggregate (avg rating)
      return res.status(201).json({ message: 'Đã thêm đánh giá', comment });
    } catch (err) {
      console.error('Create review error:', err);
      next(err);
    }
  },
];

// List reviews for product (top-level with replies)
export const getReviews = [
  ...listReviewsValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badRequestValidation(res, errors);

    try {
      const productId = String(req.query.productId);
      const status = req.query.status as string | undefined;
      const page = Number(req.query.page || 1);
      const limit = Math.min(50, Number(req.query.limit || 10));
      const rating = req.query.rating ? Number(req.query.rating) : undefined;

      const filter: any = { product: productId, parent: null, isDeleted: { $ne: true } };
      if (status) {
        if (status === 'approved') filter.isApproved = true;
        else if (status === 'pending') filter.isApproved = false;
        else if (status === 'rejected') filter.isApproved = false; // you may store a rejected flag separately
      }
      if (rating !== undefined) filter.rating = rating;

      // get total top-level comments
      const total = await Comment.countDocuments(filter);

      // fetch top-level comments + populate author (name, avatar)
      const comments = await Comment.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('author', 'name avatar role')
        .lean();

      // fetch replies for these comments
      const parentIds = comments.map(c => c._id);
      const replies = await Comment.find({ parent: { $in: parentIds }, isDeleted: { $ne: true } })
        .sort({ createdAt: 1 })
        .populate('author', 'name avatar role')
        .lean();

      // group replies by parent
      const repliesByParent = replies.reduce<Record<string, any[]>>((acc, r) => {
        const pid = String(r.parent);
        if (!acc[pid]) acc[pid] = [];
        acc[pid].push(r);
        return acc;
      }, {});

      // attach replies to comments
      const results = comments.map(c => ({ ...c, replies: repliesByParent[String(c._id)] || [] }));

      return res.json({
        productId,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        reviews: results,
      });
    } catch (err) {
      console.error('Get reviews error:', err);
      next(err);
    }
  },
];

// Approve review (admin/moderator)
export const approveReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // auth check
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    if (user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const review = await Comment.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Không tìm thấy đánh giá' });

    await review.approve(); // từ model
    return res.json({ message: 'Duyệt đánh giá thành công', review });
  } catch (err) {
    console.error('Approve review error:', err);
    next(err);
  }
};

// Unapprove / reject review (admin)
export const unapproveReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    if (user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const review = await Comment.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Không tìm thấy đánh giá' });

    await review.unapprove();
    return res.json({ message: 'Từ chối đánh giá thành công', review });
  } catch (err) {
    console.error('Unapprove review error:', err);
    next(err);
  }
};

// Reply to review — create a child comment with parent = review._id
export const replyReview = [
  ...replyValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badRequestValidation(res, errors);

    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      // only admin/staff allowed to reply (adjust as needed)
      if (user.role !== 'admin' && user.role !== 'staff') return res.status(403).json({ message: 'Forbidden' });

      const parent = await Comment.findById(req.params.id);
      if (!parent) return res.status(404).json({ message: 'Không tìm thấy đánh giá' });

      const replyData: any = {
        content: req.body.content,
        author: new Types.ObjectId(user._id),
        product: parent.product ? new Types.ObjectId(String(parent.product)) : undefined,
        parent: parent._id,
        // admin reply auto-approve
        isApproved: true,
      };

      const reply = new Comment(replyData);
      await reply.save();

      return res.status(201).json({ message: 'Trả lời đánh giá thành công', reply });
    } catch (err) {
      console.error('Reply review error:', err);
      next(err);
    }
  },
];

// Soft-delete review (admin or review owner)
export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const review = await Comment.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Không tìm thấy đánh giá' });

    // owner or admin can delete
    if (String(review.author) !== String(user._id) && user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await review.softDelete();
    return res.json({ message: 'Xóa đánh giá thành công' });
  } catch (err) {
    console.error('Delete review error:', err);
    next(err);
  }
};
