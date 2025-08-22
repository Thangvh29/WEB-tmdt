// src/controllers/user/profile.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../../models/user.model.js';
import type { AuthRequest } from '../../middlewares/types.js';
import { Types } from 'mongoose';

const badReq = (res: Response, errors: any) => res.status(400).json({ errors: errors.array ? errors.array() : errors });

/**
 * GET /api/user/profile
 * Return current user's profile (safe fields)
 */
export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    // If req.user is a full mongoose doc, we can return it; ensure password is not included by User.toJSON transform
    const payload = await User.findById((user as any)._id ?? user._id).select('-password').lean().exec();
    return res.json({ user: payload });
  } catch (err) {
    console.error('getProfile error:', err);
    next(err);
  }
};

/**
 * PUT /api/user/profile
 * Update profile fields: name, address, phone, email
 * - If changing email, ensure uniqueness
 */
export const updateProfile = [
  body('name').optional().isString().isLength({ min: 2, max: 80 }).trim(),
  body('address').optional().isString().isLength({ max: 255 }).trim(),
  body('phone').optional().isString().matches(/^\d{10,11}$/).withMessage('Số điện thoại phải có 10-11 chữ số'),
  body('email').optional().isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const updates: any = {};
      if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
      if (req.body.address !== undefined) updates.address = String(req.body.address).trim();
      if (req.body.phone !== undefined) updates.phone = String(req.body.phone).trim();
      if (req.body.email !== undefined) updates.email = String(req.body.email).toLowerCase().trim();

      // If email changed -> check unique
      if (updates.email) {
        const exists = await User.findOne({ email: updates.email, _id: { $ne: (user as any)._id ?? user._id } }).lean().exec();
        if (exists) return res.status(400).json({ message: 'Email đã được sử dụng' });
      }

      const updated = await User.findByIdAndUpdate((user as any)._id ?? user._id, { $set: updates }, { new: true, runValidators: true })
        .select('-password')
        .lean()
        .exec();

      return res.json({ message: 'Cập nhật thông tin thành công', user: updated });
    } catch (err) {
      console.error('updateProfile error:', err);
      next(err);
    }
  },
];

/**
 * POST /api/user/profile/avatar
 * Upload or set avatar.
 * - If you use multer, mount upload middleware in route before this handler.
 * - If frontend sends `avatarUrl` in body (already uploaded), it will set that.
 */
export const uploadAvatar = [
  // no express-validator for file; optional avatarUrl
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      // If multer used, file may be in req.file
      // @ts-ignore
      const file = (req as any).file;
      const avatarUrlFromBody = req.body.avatarUrl ? String(req.body.avatarUrl).trim() : null;

      let avatarUrl: string | null = null;
      if (file && file.filename) {
        // adjust path according to your upload folder/URL scheme
        avatarUrl = `/uploads/avatar/${file.filename}`;
      } else if (avatarUrlFromBody) {
        avatarUrl = avatarUrlFromBody;
      } else {
        return res.status(400).json({ message: 'Không có avatar để upload' });
      }

      const updated = await User.findByIdAndUpdate((user as any)._id ?? user._id, { $set: { avatar: avatarUrl } }, { new: true })
        .select('-password')
        .lean()
        .exec();

      return res.status(200).json({ message: 'Upload avatar thành công', user: updated });
    } catch (err) {
      console.error('uploadAvatar error:', err);
      next(err);
    }
  },
];

/**
 * DELETE /api/user/profile/avatar
 * Remove avatar (set to empty string or null)
 */
export const deleteAvatar = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const updated = await User.findByIdAndUpdate((user as any)._id ?? user._id, { $set: { avatar: '' } }, { new: true })
      .select('-password')
      .lean()
      .exec();

    return res.json({ message: 'Đã xóa avatar', user: updated });
  } catch (err) {
    console.error('deleteAvatar error:', err);
    next(err);
  }
};

/**
 * POST /api/user/profile/deactivate
 * Soft-delete / deactivate account (set isActive = false)
 */
export const deactivateAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    // If you want to require password confirmation, add it in validator and check here.
    const updated = await User.findByIdAndUpdate((user as any)._id ?? user._id, { $set: { isActive: false } }, { new: true })
      .select('-password')
      .lean()
      .exec();

    return res.json({ message: 'Tài khoản đã được vô hiệu hóa', user: updated });
  } catch (err) {
    console.error('deactivateAccount error:', err);
    next(err);
  }
};
