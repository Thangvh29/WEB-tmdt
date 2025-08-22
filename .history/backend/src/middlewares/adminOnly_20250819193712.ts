import type { RequestHandler } from 'express';
import type { AuthRequest } from './types.js';

export const adminOnly: RequestHandler = (req: AuthRequest, res, next) => {
  console.log('AdminOnly middleware - req.user:', req.user);

  // Trường hợp chưa đăng nhập
  if (!req.user) {
    return res.status(401).json({ message: 'Bạn cần đăng nhập để truy cập' });
  }

  // Trường hợp không phải admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Quyền truy cập bị từ chối: chỉ Admin mới được phép' });
  }

  // Nếu đúng admin thì cho qua
  next();
};
