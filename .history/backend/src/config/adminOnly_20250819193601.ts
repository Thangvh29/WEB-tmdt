import type { RequestHandler } from 'express';
import type { AuthRequest } from '../types/types';

export const adminOnly: RequestHandler = (req: AuthRequest, res, next) => {
  console.log('AdminOnly middleware - req.user:', req.user); // Debug
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Quyền truy cập bị từ chối' });
  }
  next();
};