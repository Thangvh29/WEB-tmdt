import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import type { AuthRequest } from './types.js';
import config from '../config/config.js';

export const protect: RequestHandler = async (req: AuthRequest, res, next) => {
  try {
    let token: string | undefined;

    // Ưu tiên lấy từ header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Nếu không có header thì fallback sang cookie (nếu bạn vẫn muốn hỗ trợ cookie login)
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    console.log("🔑 Protect middleware - Authorization header:", req.headers.authorization);
    console.log("🔑 Protect middleware - token:", token);

    if (!token) {
      return res.status(401).json({ message: "Không có token, quyền truy cập bị từ chối" });
    }

    // Xác thực token
    const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string; role: string };
    console.log("✅ Protect middleware - decoded:", decoded);

    // Nếu là route user thì lấy thông tin user
    const isUserRoute = req.originalUrl.startsWith("/api/user/");
    if (isUserRoute) {
      const user = await User.findById(decoded.userId).select("-password -passwordResetToken -passwordResetExpires");
      if (!user) {
        console.log("❌ Protect middleware - User not found for ID:", decoded.userId);
        return res.status(401).json({ message: "Người dùng không tồn tại" });
      }
      req.user = user;
    } else {
      // Admin và các route khác
      req.user = { _id: decoded.userId, role: decoded.role };
    }

    console.log("✅ Protect middleware - req.user:", req.user);
    next();
  } catch (error) {
    console.error("❌ Protect middleware - error:", error);
    res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};
