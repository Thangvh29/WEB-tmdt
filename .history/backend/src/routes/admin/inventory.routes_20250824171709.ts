import { Router } from 'express';
import { protect } from '../../middlewares/protect.js';
import { adminOnly } from '../../middlewares/adminOnly.js';
import { uploadProduct } from '../../config/multer.js';

// controllers
import {
  createProduct,
  createProductOld,
  getProducts,
  getProductDetail,
  updateProduct,
  deleteProduct,
  getOldProducts,
} from '../../controllers/admin/product.controller.js';

import { getInventory, updateStock } from '../../controllers/admin/inventory.controller.js';

const router = Router();

// Tất cả route trong file này đều yêu cầu auth + quyền admin
router.use(protect);
router.use(adminOnly);

/** ================== PRODUCT ROUTES ================== **/

// POST /api/admin/products -> thêm sản phẩm mới
router.post('/', uploadProduct.array('images', 10), createProduct);

// POST /api/admin/products/old -> thêm sản phẩm cũ
router.post('/old', uploadProduct.array('images', 10), createProductOld);

// GET /api/admin/products -> danh sách sản phẩm mới
router.get('/', getProducts);

// GET /api/admin/products/old/list -> danh sách sản phẩm cũ
router.get('/old/list', getOldProducts);

// GET /api/admin/products/:id -> chi tiết sản phẩm
router.get('/:id', getProductDetail);

// PUT /api/admin/products/:id -> cập nhật sản phẩm
router.put('/:id', uploadProduct.array('images', 10), updateProduct);

// PATCH /api/admin/products/:id/stock -> cập nhật tồn kho
router.patch('/:id/stock', updateStock);

// DELETE /api/admin/products/:id -> xóa sản phẩm
router.delete('/:id', deleteProduct);

// POST /api/admin/products/upload-image -> upload 1 ảnh
router.post('/upload-image', uploadProduct.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Không có file được upload' });
  const fileUrl = `/uploads/product/${req.file.filename}`;
  res.status(201).json({ message: 'Upload thành công', file: { filename: req.file.filename, url: fileUrl } });
});

export default router;
