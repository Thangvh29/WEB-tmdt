import { Router, RequestHandler } from 'express';
import {
  register,
  login,
  logout,
  googleLogin,
  googleCallback,
  facebookLogin,
  facebookCallback,
  authSuccess,
  authFailure,
} from '../controllers/auth.controller.js';

const router = Router();

// Đăng ký
router.post('/register', ...(register as RequestHandler[]));

// Đăng nhập
router.post('/login', ...(login as RequestHandler[]));

// Đăng nhập qua Google
router.get('/google', googleLogin);
router.get('/google/callback', ...(googleCallback as RequestHandler[]));

// Đăng nhập qua Facebook
router.get('/facebook', facebookLogin);
router.get('/facebook/callback', ...(facebookCallback as RequestHandler[]));

// Xử lý thành công/thất bại
router.get('/success', authSuccess);
router.get('/failure', authFailure);

// Đăng xuất
router.post('/logout', logout);

export default router;