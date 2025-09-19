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

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) return res.status(401).json({ message: 'Không có token, quyền truy cập bị từ chối' });

    const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;

    const isUserRoute = req.originalUrl.startsWith('/api/user/');
    if (isUserRoute) {
      const user = await User.findById(decoded._id).select('-password -passwordResetToken -passwordResetExpires');
      if (!user) return res.status(401).json({ message: 'Người dùng không tồn tại' });
      req.user = user;
    } else {
      // Admin route
      req.user = { _id: decoded._id, role: decoded.role };
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};
