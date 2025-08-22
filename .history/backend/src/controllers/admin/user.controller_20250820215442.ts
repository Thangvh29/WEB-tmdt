import type { Request, Response, NextFunction } from 'express';
import { query, validationResult } from 'express-validator';
import { User } from '../../models/user.model.js';

// Validation cho truy vấn danh sách người dùng
export const getUsersValidation = [
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Tìm kiếm không được vượt quá 100 ký tự'),
  query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
  query('limit').optional().isInt({ min: 1 }).withMessage('Giới hạn phải là số nguyên dương'),
];

// Liệt kê danh sách người dùng
export const getUsers = [
  getUsersValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { search, page = 1, limit = 10 } = req.query;
      const filter: any = { role: { $ne: 'admin' } }; // Chỉ lấy người dùng không phải admin

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const users = await User.find(filter)
        .select('name avatar phone address email')
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .sort({ createdAt: -1 });

      const total = await User.countDocuments(filter);

      res.json({
        users: users.map((user) => ({
          _id: user._id,
          name: user.name,
          avatar: user.avatar,
          phone: user.phone,
          address: user.address,
          email: user.email,
        })),
        total,
        page: Number(page),
        limit: Number(limit),
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },
];