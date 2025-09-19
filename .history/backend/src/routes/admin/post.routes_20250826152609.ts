import { Router } from "express";
import { protect } from "../../middlewares/protect.js";
import { adminOnly } from "../../middlewares/adminOnly.js";
import { uploadPost } from "../../config/multer.js";

// Controller
import {
  createPost,
  getFeed,
  getUserPosts,
  getPostDetail,
  updatePost,
  deletePost,
  moderatePost,
  likePost,
  unlikePost,
} from "../../controllers/admin/post.controller.js";

const router = Router();

// Public feed (nếu muốn public không cần login thì bỏ protect)
router.get("/feed", protect, getFeed);

// Lấy bài viết của user (admin hoặc của chính user đó)
router.get("/user", protect, getUserPosts);

// Chi tiết bài viết
router.get("/:id", protect, getPostDetail);

// Tạo bài viết (cho phép upload nhiều ảnh)
router.post("/", protect, uploadPost.array("images", 6), createPost);

// Cập nhật bài viết
router.put("/:id", protect, uploadPost.array("images", 6), updatePost);

// Xóa bài viết (soft delete)
router.delete("/:id", protect, deletePost);

// Like / Unlike
router.post("/:id/like", protect, likePost);
router.post("/:id/unlike", protect, unlikePost);

// Admin duyệt bài
router.post("/:id/moderate", protect, adminOnly, moderatePost);

// Upload 1 ảnh riêng lẻ (trả về absolute URL)
router.post(
  "/upload-image",
  protect,
  adminOnly,
  uploadPost.single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Không có file được upload" });
    }

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/post/${req.file.filename}`;

    res.status(201).json({
      message: "Upload thành công",
      file: {
        filename: req.file.filename,
        url: fileUrl, // absolute URL
      },
    });
  }
);

export default router;
