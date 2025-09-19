// controllers/post.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Post } from '../../models/post.model.js';
import { User } from '../../models/user.model.js';
import { Comment } from '../../models/comment.model.js';
import type { AuthRequest } from '../../middlewares/types.js';
import mongoose, { Types } from 'mongoose';

// Helpers
const badReq = (res: Response, errors: any) =>
  res.status(400).json({ errors: errors.array ? errors.array() : errors });

// Role check helper
function requireRole(user: any, roles: string[]) {
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Validation
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

/**
 * Create Post
 * - files upload qua multer
 * - images lưu absolute URL thay vì relative
 */
export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const { title, content } = req.body;
    const files = req.files as Express.Multer.File[];
    const user = req.user;

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: 'Không được phép' });
    }

    const imagePaths = files
      ? files.map(
          (file) =>
            `${req.protocol}://${req.get('host')}/uploads/posts/${file.filename}`
        )
      : [];

    const post = await Post.create({
      title,
      content,
      images: imagePaths,
      author: user._id,
    });

    res.status(201).json({ success: true, post });
  } catch (err: any) {
    console.error('Lỗi tạo bài viết:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo bài viết',
      error: err.message,
    });
  }
};

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
// Convert relative path -> absolute URL
function toAbsoluteUrl(req: Request, path: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path; // đã là absolute
  return `${req.protocol}://${req.get("host")}${path.startsWith("/") ? "" : "/"}${path}`;
}

// Map images sang absolute
function mapPostImages(req: Request, post: any) {
  if (post.images && Array.isArray(post.images)) {
    post.images = post.images.map((img: string) => toAbsoluteUrl(req, img));
  }
  return post;
}
