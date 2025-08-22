// controllers/user.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { User } from '../../models/user.model.js';
import type { AuthRequest } from '../../\
';
import mongoose, { Types } from 'mongoose';

/**
 * Validation rules
 */
export const getUsersValidation = [
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Tìm kiếm không được vượt quá 100 ký tự'),
  query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
  query('limit').optional().isInt({ min: 1 }).withMessage('Giới hạn phải là số nguyên dương'),
];

export const userIdParam = [param('id').isMongoId().withMessage('id không hợp lệ')];

export const updateUserValidation = [
  param('id').isMongoId().withMessage('id không hợp lệ'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Tên phải từ 2 đến 100 ký tự'),
  body('avatar').optional().isURL().withMessage('Avatar phải là URL hợp lệ'),
  body('address').optional().trim().isLength({ max: 200 }).withMessage('Địa chỉ không được vượt quá 200 ký tự'),
  body('phone').optional().trim().matches(/^[0-9]{10,11}$/).withMessage('Số điện thoại phải là 10 hoặc 11 số'),
  body('email').optional().isEmail().withMessage('Email không hợp lệ'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Role không hợp lệ'),
  body('isActive').optional().isBoolean().withMessage('isActive phải là boolean'),
];

/**
 * Helper: standard bad request
 */
const badReq = (res: Response, errors: any) => res.status(400).json({ errors: errors.array ? errors.array() : errors });

/**
 * GET /api/admin/users -> danh sách (bạn đã có getUsers, gộp ở đây)
 * (Nếu cần, import/ reuse getUsers from the file you already provided)
 */

/**
 * GET /api/admin/users/:id
 * Lấy chi tiết 1 user
 */
export const getUserDetail = [
  ...userIdParam,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const id = req.params.id;
      const user = await User.findById(id).select('name avatar phone address email role isActive createdAt updatedAt');
      if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
      return res.json({ user });
    } catch (err) {
      console.error('Get user detail error:', err);
      next(err);
    }
  },
];

/**
 * PATCH /api/admin/users/:id
 * Cập nhật user (admin) — admin có thể sửa user; user self-edit nên dùng route khác (profile)
 */
export const updateUser = [
  ...updateUserValidation,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const admin = req.user;
      if (!admin) return res.status(401).json({ message: 'Unauthorized' });
      if (admin.role !== 'admin') return res.status(403).json({ message: 'Chỉ admin mới có quyền chỉnh sửa người dùng' });

      const id = req.params.id;
      const { name, avatar, address, phone, email, role, isActive } = req.body as any;

      const user = await User.findById(id);
      if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

      // Check email unique if changed
      if (email && email !== user.email) {
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: 'Email đã được sử dụng' });
      }

      // Check phone unique if changed
      if (phone && phone !== user.phone) {
        const existsPhone = await User.findOne({ phone });
        if (existsPhone) return res.status(400).json({ message: 'Số điện thoại đã được sử dụng' });
      }

      // Prevent demoting the last admin (optional): ensure at least one admin remains
      if (role && role !== 'admin') {
        // If changing from admin -> user, ensure there is at least another admin
        if (user.role === 'admin') {
          const adminCount = await User.countDocuments({ role: 'admin', _id: { $ne: user._id } });
          if (adminCount === 0) {
            return res.status(400).json({ message: 'Không thể hạ quyền admin: cần ít nhất 1 admin trong hệ thống' });
          }
        }
      }

      // Apply updates
      if (name !== undefined) user.name = name;
      if (avatar !== undefined) user.avatar = avatar;
      if (address !== undefined) user.address = address;
      if (phone !== undefined) user.phone = phone;
      if (email !== undefined) user.email = email;
      if (role !== undefined) user.role = role;
      if (isActive !== undefined) user.isActive = isActive;

      await user.save();
      return res.json({
        message: 'Cập nhật người dùng thành công',
        user: {
          _id: user._id,
          name: user.name,
          avatar: user.avatar,
          phone: user.phone,
          address: user.address,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        },
      });
    } catch (err) {
      console.error('Update user error:', err);
      next(err);
    }
  },
];

/**
 * DELETE /api/admin/users/:id
 * Soft-delete: set isActive = false
 */
export const deleteUser = [
  ...userIdParam,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const admin = req.user;
      if (!admin) return res.status(401).json({ message: 'Unauthorized' });
      if (admin.role !== 'admin') return res.status(403).json({ message: 'Chỉ admin mới có quyền xóa người dùng' });

      const id = req.params.id;

      // Prevent admin deleting themselves accidentally (optional)
      if (String(admin._id) === String(id)) {
        return res.status(400).json({ message: 'Không thể xóa chính bạn' });
      }

      const user = await User.findById(id);
      if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

      // soft delete: set isActive = false
      user.isActive = false;
      await user.save();

      return res.json({ message: 'Đã vô hiệu hóa tài khoản người dùng' });
    } catch (err) {
      console.error('Delete user error:', err);
      next(err);
    }
  },
];

/**
 * POST /api/admin/users/:id/restore
 * Khôi phục user (set isActive = true)
 */
export const restoreUser = [
  ...userIdParam,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const admin = req.user;
      if (!admin) return res.status(401).json({ message: 'Unauthorized' });
      if (admin.role !== 'admin') return res.status(403).json({ message: 'Chỉ admin mới có quyền khôi phục người dùng' });

      const id = req.params.id;
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

      user.isActive = true;
      await user.save();

      return res.json({ message: 'Khôi phục tài khoản thành công' });
    } catch (err) {
      console.error('Restore user error:', err);
      next(err);
    }
  },
];

/**
 * DELETE hard (dangerous) - admin only
 * DELETE /api/admin/users/:id/hard
 */
export const hardDeleteUser = [
  ...userIdParam,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const admin = req.user;
      if (!admin) return res.status(401).json({ message: 'Unauthorized' });
      if (admin.role !== 'admin') return res.status(403).json({ message: 'Chỉ admin mới có quyền xóa cứng người dùng' });

      const id = req.params.id;

      // Prevent deleting last admin or self
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
      if (String(admin._id) === String(id)) return res.status(400).json({ message: 'Không thể xóa chính bạn' });

      if (user.role === 'admin') {
        const otherAdmins = await User.countDocuments({ role: 'admin', _id: { $ne: user._id } });
        if (otherAdmins === 0) return res.status(400).json({ message: 'Không thể xóa admin cuối cùng' });
      }

      await User.findByIdAndDelete(id);
      return res.json({ message: 'Đã xóa người dùng (hard delete)' });
    } catch (err) {
      console.error('Hard delete user error:', err);
      next(err);
    }
  },
];
