// src/middlewares/protect.ts
import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import type { AuthRequest } from './types.js';
import config from '../config/config.js';

interface JwtPayload {
  _id: string;
  role: string;
  iat: number;
  exp: number;
}

export const protect: RequestHandler = async (req: AuthRequest, res, next) => {
  try {
    let token: string | undefined;

    // Ưu tiên lấy token từ header
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Fallback sang cookie nếu có
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    console.log('🔑 Protect middleware - Authorization header:', req.headers.authorization);
    console.log('🔑 Protect middleware - token:', token);

    if (!token) {
      return res.status(401).json({ message: 'Không có token, quyền truy cập bị từ chối' });
    }

    // Xác thực token
    const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
    console.log('✅ Protect middleware - decoded:', decoded);

    // Kiểm tra route user hay admin
    const isUserRoute = req.originalUrl.startsWith('/api/user/');

    if (isUserRoute) {
      // Lấy thông tin user từ DB
      const user = await User.findById(decoded._id).select(
        '-password -passwordResetToken -passwordResetExpires'
      );
      if (!user) {
        console.log('❌ Protect middleware - User not found for ID:', decoded._id);
        return res.status(401).json({ message: 'Người dùng không tồn tại' });
      }
      req.user = user; // user đầy đủ từ DB
    } else {
      // Admin hoặc các route khác: chỉ cần _id và role
      req.user = { _id: decoded._id, role: decoded.role };
    }

    console.log('✅ Protect middleware - req.user:', req.user);
    next();
  } catch (error) {
    console.error('❌ Protect middleware - error:', error);
    res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};
