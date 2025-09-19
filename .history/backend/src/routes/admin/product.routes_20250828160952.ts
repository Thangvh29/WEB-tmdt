// src/routes/user/product.routes.ts
import express from "express";
import * as ProductCtrl from "../../controllers/user/product.controller.js";
import { protect } from "../../middlewares/protect.js";
import { uploadProduct } from "../../config/multer.js"; // thêm multer upload

const router = express.Router();

// Public listing & filters
router.get("/", ProductCtrl.listProducts);
router.get("/filters", ProductCtrl.getProductFilters);

// Product detail
router.get("/:id", ProductCtrl.getProductDetail);

// Related
router.get("/:id/related", ProductCtrl.getRelatedProducts);

// Reviews
router.get("/:id/reviews", ProductCtrl.getProductReviews);

// Variant check
router.post("/:id/check-variant", ProductCtrl.checkVariant);

// ===== Upload ảnh (cho user) =====
// Nếu muốn bắt buộc đăng nhập thì thêm protect
router.post(
  "/upload-image",
  protect, // nếu user cần đăng nhập mới được upload
  uploadProduct.single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Không có file được upload" });
    }

    // trả absolute URL
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/product/${req.file.filename}`;

    res.status(201).json({
      message: "Upload thành công",
      file: {
        filename: req.file.filename,
        url: fileUrl,
      },
    });
  }
);

export default router;
