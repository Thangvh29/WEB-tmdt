// src/controllers/admin/profile.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../../models/user.model.js';
import type { AuthRequest } from '../../middlewares/types.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validation cho cập nhật profile admin
export const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên phải từ 2 đến 100 ký tự'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Địa chỉ không được vượt quá 200 ký tự'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9]{10,11}$/)
    .withMessage('Số điện thoại phải là 10 hoặc 11 số'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email không hợp lệ'),
];

const makeFullUrl = (req: Request, relativePath?: string) => {
  if (!relativePath) return '';
  // ensure leading slash
  const rel = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${req.protocol}://${req.get('host')}${rel}`;
};

// Lấy thông tin profile admin hiện tại
export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    console.log("🔍 Get admin profile - req.user:", req.user);

    const user = await User.findById(req.user?._id).select('name avatar address phone email role createdAt');

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy admin' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin có thể xem profile này' });
    }

    const avatarUrl = makeFullUrl(req, user.avatar || '');

    console.log("✅ Get admin profile success:", {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: avatarUrl,
    });

    res.json({
      message: 'Lấy thông tin admin thành công',
      profile: {
        _id: user._id,
        name: user.name,
        avatar: avatarUrl,
        address: user.address || '',
        phone: user.phone || '',
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Get admin profile error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin admin' });
  }
};

// Cập nhật profile admin
export const updateProfile = [
  updateProfileValidation,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      console.log("🔄 Update admin profile - req.user:", req.user);
      console.log("🔄 Update admin profile - req.body:", req.body);
      console.log("🔄 Update admin profile - req.file:", req.file ? 'Has file' : 'No file');

      const { name, address, phone, email } = req.body;

      const user = await User.findById(req.user?._id);

      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy admin' });
      }

      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Chỉ admin có thể cập nhật profile này' });
      }

      // Kiểm tra email duy nhất (nếu thay đổi email)
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ message: 'Email đã được sử dụng bởi tài khoản khác' });
        }
      }

      // Cập nhật các trường được cung cấp
      if (name !== undefined) user.name = name;
      if (address !== undefined) user.address = address;
      if (phone !== undefined) user.phone = phone;
      if (email !== undefined) user.email = email;

      // Xử lý avatar upload (nếu có)
      if (req.file) {
        // Xóa avatar cũ (nếu có) để tránh chiếm dung lượng
        try {
          if (user.avatar) {
            const oldRel = user.avatar.startsWith('/') ? user.avatar.slice(1) : user.avatar; // remove leading slash
            const oldFullPath = path.join(__dirname, '..', '..', oldRel);
            if (fs.existsSync(oldFullPath)) {
              fs.unlinkSync(oldFullPath);
              console.log('🗑️ Deleted old avatar file:', oldFullPath);
            }
          }
        } catch (err) {
          console.warn('⚠️ Could not delete old avatar file:', err);
        }

        // Lưu new avatar relative path (leading slash)
        user.avatar = `/uploads/avatar/${req.file.filename}`;
        console.log("📸 Avatar uploaded:", user.avatar);
      }

      await user.save();

      console.log("✅ Update admin profile success");

      res.json({
        message: 'Cập nhật profile admin thành công',
        profile: {
          _id: user._id,
          name: user.name,
          avatar: makeFullUrl(req, user.avatar || ''),
          address: user.address || '',
          phone: user.phone || '',
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('❌ Update admin profile error:', error);
      res.status(500).json({ message: 'Lỗi server khi cập nhật profile admin' });
    }
  },
];
