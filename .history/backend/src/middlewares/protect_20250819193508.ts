import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';   // khi build TS → JS thì file là .js
import type { AuthRequest } from './types.js';    // cũng phải để .js vì khi chạy là JS
import config from '../config/config.';         // bạn cần có file config chứa JWT_SECRET

export const protect: RequestHandler = async (req: AuthRequest, res, next) => {
  try {
    let token = req.headers.authorization?.split(' ')[1];
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    console.log('Protect middleware - token:', token);

    if (!token) {
      return res.status(401).json({ message: 'Không có token, quyền truy cập bị từ chối' });
    }

    // Xác thực token
    const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string; role: string };
    console.log('Protect middleware - decoded:', decoded);

    // Nếu là API user thì lấy thông tin đầy đủ
    const isUserRoute = req.originalUrl.startsWith('/api/user/');
    if (isUserRoute) {
      const user = await User.findById(decoded.userId).select('-password -passwordResetToken -passwordResetExpires');
      if (!user) {
        console.log('Protect middleware - User not found for ID:', decoded.userId);
        return res.status(401).json({ message: 'Người dùng không tồn tại' });
      }
      req.user = user;
    } else {
      // Còn lại (admin, v.v...)
      req.user = { _id: decoded.userId, role: decoded.role };
    }

    console.log('Protect middleware - req.user:', req.user);
    next();
  } catch (error) {
    console.error('Protect middleware - error:', error);
    res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};
