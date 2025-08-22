import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.ts';  // model User thực tế
import type { AuthRequest } from './types.js';

// Lấy secret từ biến môi trường
const JWT_SECRET = process.env.JWT_SECRET || 'changeme_secret';

export const protect: RequestHandler = async (req: AuthRequest, res, next) => {
  try {
    // Lấy token từ header hoặc cookie
    let token: string | undefined;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Không có token, quyền truy cập bị từ chối' });
    }

    // Giải mã token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: 'Token không hợp lệ' });
    }

    // Nếu là API của user → fetch user đầy đủ
    const isUserRoute = req.originalUrl.startsWith('/api/user/');
    if (isUserRoute) {
      const user = await User.findById(decoded.userId).select(
        '-password -passwordResetToken -passwordResetExpires'
      );

      if (!user) {
        return res.status(401).json({ message: 'Người dùng không tồn tại' });
      }

      req.user = user;
    } else {
      // Các route khác (admin, staff, v.v…)
      req.user = { _id: decoded.userId, role: decoded.role };
    }

    // ✅ Debug log (ẩn token để an toàn)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Protect] decoded:', decoded);
      console.log('[Protect] req.user:', req.user);
    }

    next();
  } catch (error) {
    console.error('[Protect] Error verifying token:', error);
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};
