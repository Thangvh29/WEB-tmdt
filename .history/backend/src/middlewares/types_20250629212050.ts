import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: any; // Thông tin người dùng từ middleware protect
}