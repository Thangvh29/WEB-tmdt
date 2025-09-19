import { Router } from "express";
import { protect } from "../../middlewares/protect.js";
import { adminOnly } from "../../middlewares/adminOnly.js";

// controllers
import {
  createProduct,
  createProductOld,
  getNewProducts,
  getOldProducts,
  getProductDetail,
  updateProduct,
  deleteProduct,
} from "../../controllers/admin/product.controller.js";

import {
  getInventory,
  updateStock,
} from "../../controllers/admin/inventory.controller.js";

import { uploadProduct } from "../../config/multer.js";

const router = Router();

// tất cả route trong file này đều yêu cầu auth + quyền admin
router.use(protect);
router.use(adminOnly);

/**
 * POST /api/admin/products
 * - Thêm sản phẩm mới
 */
router.post("/", uploadProduct.array("images", 10), createProduct);

/**
 * POST /api/admin/products/old
 * - Thêm sản phẩm cũ
 */
router.post("/old", createProductOld);

/**
 * GET /api/admin/products/new
 * - Danh sách sản phẩm mới
 */
router.get("/new", getNewProducts);

/**
 * GET /api/admin/products/old
 * - Danh sách sản phẩm cũ
 */
router.get("/old", getOldProducts);

/**
 * GET /api/admin/products/:id
 * - Chi tiết sản phẩm
 */
router.get("/:id", getProductDetail);

/**
 * PUT /api/admin/products/:id
 * - Cập nhật sản phẩm
 */
router.put("/:id", uploadProduct.array("images", 10), updateProduct);

/**
 * PATCH /api/admin/products/:id/stock
 * - Cập nhật tồn kho
 */
router.patch("/:id/stock", updateStock);

/**
 * DELETE /api/admin/products/:id
 * - Xóa sản phẩm
 */
router.delete("/:id", deleteProduct);

/**
 * GET /api/admin/products/inventory/list
 * - Danh sách tồn kho
 */
router.get("/inventory/list", getInventory);

/**
 * POST /api/admin/products/upload-image
 * - Upload single image
 */
router.post("/upload-image", uploadProduct.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Không có file được upload" });
  }

  const fileUrl = `/uploads/product/${req.file.filename}`;
  res.status(201).json({
    message: "Upload thành công",
    file: { filename: req.file.filename, url: fileUrl },
  });
});

export default router;
