import type { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { User } from "../../models/user.model.js";
import type { AuthRequest } from "../../middlewares/types.js";
import fs from "fs";
import path from "path";

// Validation cho cập nhật profile admin
export const updateProfileValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Tên phải từ 2 đến 100 ký tự"),
  body("address")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Địa chỉ không được vượt quá 200 ký tự"),
  body("phone")
    .optional()
    .trim()
    .matches(/^[0-9]{10,11}$/)
    .withMessage("Số điện thoại phải là 10 hoặc 11 số"),
  body("email").optional().isEmail().withMessage("Email không hợp lệ"),
];

// Helper build URL tuyệt đối
const buildAvatarURL = (req: Request, avatarPath?: string) => {
  if (!avatarPath) return "";
  const backendURL =
    process.env.BACKEND_URL || req.app.locals.BACKEND_URL || "";
  return `${backendURL}${avatarPath}`;
};

// GET /api/admin/profile/me
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?._id).select(
      "name avatar address phone email role createdAt"
    );

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy admin" });
    }
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Chỉ admin có thể xem profile" });
    }

    res.json({
      message: "Lấy thông tin admin thành công",
      profile: {
        _id: user._id,
        name: user.name,
        avatar: buildAvatarURL(req, user.avatar),
        address: user.address || "",
        phone: user.phone || "",
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Get admin profile error:", error);
    res.status(500).json({ message: "Lỗi server khi lấy thông tin admin" });
  }
};

// PUT /api/admin/profile/me
export const updateProfile = [
  updateProfileValidation,
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, address, phone, email } = req.body;
      const user = await User.findById(req.user?._id);
      if (!user) return res.status(404).json({ message: "Không tìm thấy admin" });
      if (user.role !== "admin")
        return res.status(403).json({ message: "Chỉ admin được cập nhật" });

      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res
            .status(400)
            .json({ message: "Email đã được sử dụng bởi tài khoản khác" });
        }
      }

      if (name !== undefined) user.name = name;
      if (address !== undefined) user.address = address;
      if (phone !== undefined) user.phone = phone;
      if (email !== undefined) user.email = email;

      if (req.file) {
        user.avatar = `/uploads/avatar/${req.file.filename}`;
      }

      await user.save();

      res.json({
        message: "Cập nhật profile admin thành công",
        profile: {
          _id: user._id,
          name: user.name,
          avatar: buildAvatarURL(req, user.avatar),
          address: user.address || "",
          phone: user.phone || "",
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("❌ Update admin profile error:", error);
      res.status(500).json({ message: "Lỗi server khi cập nhật profile admin" });
    }
  },
];

// POST /api/admin/profile/avatar
export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy admin" });
    if (user.role !== "admin")
      return res.status(403).json({ message: "Chỉ admin được cập nhật avatar" });

    if (!req.file) {
      return res.status(400).json({ message: "Không có file được tải lên" });
    }

    user.avatar = `/uploads/avatar/${req.file.filename}`;
    await user.save();

    res.json({
      message: "Tải avatar thành công",
      profile: {
        _id: user._id,
        avatar: buildAvatarURL(req, user.avatar),
      },
    });
  } catch (err) {
    console.error("❌ Upload avatar admin error:", err);
    res.status(500).json({ message: "Lỗi server khi upload avatar" });
  }
};

// DELETE /api/admin/profile/avatar
export const deleteAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy admin" });

    if (user.avatar) {
      const avatarPath = path.join(process.cwd(), "public", user.avatar);
      if (fs.existsSync(avatarPath)) fs.unlinkSync(avatarPath);
      user.avatar = "";
      await user.save();
    }

    res.json({ message: "Xóa avatar thành công" });
  } catch (err) {
    console.error("❌ Delete avatar admin error:", err);
    res.status(500).json({ message: "Lỗi server khi xóa avatar" });
  }
};

// POST /api/admin/profile/deactivate
export const deactivateAccount = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy admin" });

    user.isActive = false;
    await user.save();

    res.json({ message: "Tài khoản admin đã bị vô hiệu hóa" });
  } catch (err) {
    console.error("❌ Deactivate admin account error:", err);
    res.status(500).json({ message: "Lỗi server khi vô hiệu hóa tài khoản" });
  }
};
