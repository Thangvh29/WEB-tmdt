import type { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { User } from '../models/user.model.js';
import config from '../config/config.js'; // Giả sử bạn có file config chứa JWT_SECRET
import type { AuthRequest } from '../middlewares/types.js'; // Import AuthRequest interface
// Validation rules
import { registerValidation, loginValidation } from '../validators/'; // Fix import path, remove .js

// Ghi chú các trường trong User model:
// - name: string, bắt buộc, 2-80 ký tự
// - email: string, bắt buộc, unique, định dạng email hợp lệ
// - password: string, bắt buộc (trừ khi dùng social login), tối thiểu 8 ký tự
// - phone: string, tùy chọn, 10-11 số
// - avatar: string, tùy chọn, default ''
// - address: string, tùy chọn, default ''
// - role: 'user' | 'admin', default 'user'
// - socialLogin: { provider: 'google' | 'facebook', id: string }, tùy chọn
// - isActive: boolean, default true
// - createdAt, updatedAt: Date, tự động bởi timestamps

// Đăng ký user
export const register = [
  // Validation middleware
  registerValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone } = req.body;

    try {
      // Kiểm tra email đã tồn tại
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: 'Email đã tồn tại' });
      }

      // Tạo user mới
      user = new User({ name, email, password, phone });
      await user.save();

      // Tạo JWT token
      const token = user.generateAuthToken();
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      });

      res.status(201).json({
        message: 'Đăng ký thành công',
        user: { id: user._id, name, email, phone, role: user.role },
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },
];

// Đăng nhập user
export const login = [
  // Validation middleware
  loginValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { identifier, password } = req.body; // identifier có thể là email hoặc name

    try {
      // Tìm user bằng email hoặc name
      const user = await User.findOne({
        $or: [{ email: identifier }, { name: identifier }],
      }).select('+password');

      if (!user) {
        return res.status(400).json({ message: 'Email hoặc tên không tồn tại' });
      }

      // Kiểm tra password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Mật khẩu không đúng' });
      }

      // Tạo JWT token
      const token = user.generateAuthToken();
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      });

      res.json({
        message: 'Đăng nhập thành công',
        user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },
];

// Đăng nhập qua Google
export const googleLogin = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

// Callback sau khi Google xác thực
export const googleCallback = [
  passport.authenticate('google', { session: false }),
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user; // req.user được passport inject
      if (!user) {
        return res.redirect('/api/auth/failure');
      }
      const token = jwt.sign({ _id: user._id, role: user.role }, config.JWT_SECRET || 'secret', {
        expiresIn: '7d',
      });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.redirect('/api/auth/success');
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect('/api/auth/failure');
    }
  },
];

// Đăng nhập qua Facebook
export const facebookLogin = passport.authenticate('facebook', {
  scope: ['email'],
});

// Callback sau khi Facebook xác thực
export const facebookCallback = [
  passport.authenticate('facebook', { session: false }),
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.redirect('/api/auth/failure');
      }
      const token = jwt.sign({ _id: user._id, role: user.role }, config.JWT_SECRET || 'secret', {
        expiresIn: '7d',
      });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.redirect('/api/auth/success');
    } catch (error) {
      console.error('Facebook callback error:', error);
      res.redirect('/api/auth/failure');
    }
  },
];

// Route xử lý thành công sau social login
export const authSuccess = (req: Request, res: Response) => {
  res.json({ message: 'Đăng nhập thành công qua social login' });
};

// Route xử lý thất bại sau social login
export const authFailure = (req: Request, res: Response) => {
  res.status(401).json({ message: 'Đăng nhập qua social login thất bại' });
};

// Đăng xuất
export const logout = (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Đăng xuất thành công' });
};