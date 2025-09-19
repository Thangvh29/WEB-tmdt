// src/routes/admin/product.routes.ts
import { Router } from "express";
import { protect } from "../../middlewares/protect.js";
import { adminOnly } from "../../middlewares/adminOnly.js";
import { uploadProduct } from "../../config/multer.js";

import {
  createProduct,
  createProductOld,
  getNewProducts,
  getOldProducts,
  getProductDetail,
  updateProduct,
  deleteProduct,
  addVariant,
  updateVariant,
  deleteVariant,
} from "../../controllers/admin/product.controller.js";

const router = Router();

router.use(protect);
router.use(adminOnly);

// Sản phẩm mới
router.post("/", createProduct);
router.get("/new", getNewProducts);

// Sản phẩm cũ
router.post("/old", createProductOld);
router.get("/old", getOldProducts);

// Chi tiết, update, delete
router.get("/:id", getProductDetail);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

// Biến thể
router.post("/:id/variants", addVariant);
router.put("/:id/variants/:variantId", updateVariant);
router.delete("/:id/variants/:variantId", deleteVariant);

// Upload 1 ảnh sản phẩm
router.post("/upload-image", uploadProduct.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Không có file được upload" });
  }

  // Trả về absolute URL thay vì relative
  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/product/${req.file.filename}`;

  res.status(201).json({
    message: "Upload thành công",
    file: {
      filename: req.file.filename,
      url: fileUrl,
    },
  });
});

export default router;
