import type { RequestHandler } from 'express';
import type { AuthRequest } from './types.js';

export const userOnly: RequestHandler = (req: AuthRequest, res, next) => {
  console.log('UserOnly middleware - req.user:', req.user);

  // Trường hợp chưa đăng nhập
  if (!req.user) {
    return res.status(401).json({ message: 'Bạn cần đăng nhập để truy cập' });
  }

  // Trường hợp không phải role 'user'
  if (req.user.role !== 'user') {
    return res.status(403).json({ message: 'Quyền truy cập bị từ chối: chỉ User mới được phép' });
  }

  // Nếu đúng user thì cho qua
  next();
};
