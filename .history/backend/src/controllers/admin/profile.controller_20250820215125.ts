import type { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../../models/user.model.js';
import { AuthRequest } from '../../';

// Validation cho cập nhật profile
export const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên phải từ 2 đến 100 ký tự'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar phải là URL hợp lệ'),
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

// Xem thông tin profile admin
export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?._id).select('name avatar address phone email role');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy admin' });
    }
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin có thể xem profile này' });
    }
    res.json({
      profile: {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
        address: user.address,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Lỗi server' });
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
      const { name, avatar, address, phone, email } = req.body;
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
          return res.status(400).json({ message: 'Email đã được sử dụng' });
        }
      }

      // Cập nhật các trường được cung cấp
      if (name) user.name = name;
      if (avatar) user.avatar = avatar;
      if (address) user.address = address;
      if (phone) user.phone = phone;
      if (email) user.email = email;

      await user.save();
      res.json({
        message: 'Cập nhật profile thành công',
        profile: {
          _id: user._id,
          name: user.name,
          avatar: user.avatar,
          address: user.address,
          phone: user.phone,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },
];