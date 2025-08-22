import type { RequestHandler } from 'express';
import type { AuthRequest } from './types.js';

export const userOnly: RequestHandler = (req: AuthRequest, res, next) => {
  if (!req.user || req.user.role !== 'user') {
    res.status(403).json({ message: 'Quyền truy cập bị từ chối' });
    return;
  }
  next();
};