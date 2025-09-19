// src/routes/user/product.routes.js
import express from "express";
import * as ProductCtrl from "../../controllers/user/product.controller.js";
import { protect } from "../../middlewares/protect.js";
import { userOnly } from "../../middlewares/userOnly.js";
import { uploadProduct } from "../../config/multer.js";

const router = express.Router();

// ========== Public ==========
router.get("/new", ProductCtrl.listNewProducts);
router.get("/old", ProductCtrl.listOldProducts);
router.get("/", ProductCtrl.listProducts);
router.get("/filters", ProductCtrl.getProductFilters);
router.get("/:id", ProductCtrl.getProductDetail);
router.get("/:id/related", ProductCtrl.getRelatedProducts);
router.get("/:id/reviews", ProductCtrl.getProductReviews);
router.post("/:id/check-variant", ProductCtrl.checkVariant);
router.post("/:id/reviews", protect, userOnly, ProductCtrl.addProductReview);
router.post(
  "/:id/reviews/:parentId/reply",
  protect,
  userOnly,
  ProductCtrl.addProductReviewReply
);

// ========== User-only ==========
router.post(
  "/upload-image",
  protect,
  userOnly,
  uploadProduct.single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Không có file được upload" });
    }

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
