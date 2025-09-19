// src/routes/admin/product.routes.ts
import { Router } from 'express';
import { protect } from '../../middlewares/protect.js';
import { adminOnly } from '../../middlewares/adminOnly.js';

// controllers (đường dẫn .js vì khi build TS -> JS bạn import .js)
import {
  createProduct,
  getProducts,
  getProductDetail,
  updateProduct,
  deleteProduct,
} from '../../controllers/admin/product.controller.js';

import {
  getInventory,
  updateStock,
} from '../../controllers/admin/inventory.controller.js';
import { getCategories } from '../../controllers/category.controller';
// multer instances (exported từ src/config/multer.ts)
import { uploadProduct } from '../../config/multer.js';

const router = Router();

// tất cả route trong file này đều yêu cầu auth + quyền admin
router.use(protect);
router.use(adminOnly);

/**
 * POST /api/admin/products
 * - Thêm sản phẩm mới
 * - Expect multipart/form-data:
 *    - images: file[] (tối đa 10)
 *    - các field json khác: name, brand, type, price, specs, variants, ...
 *
 * Nếu frontend gửi ảnh lên cloud và chỉ gửi URLs => không cần multipart; gửi JSON như bình thường.
 */
router.post('/', uploadProduct.array('images', 10), createProduct);

/**
 * GET /api/admin/products
 * - Danh sách sản phẩm (filter/pagination handled in controller)
 */
router.get('/', getProducts);

/**
 * GET /api/admin/products/:id
 * - Chi tiết sản phẩm
 */
router.get('/:id', getProductDetail);

/**
 * PUT /api/admin/products/:id
 * - Cập nhật sản phẩm
 * - Hỗ trợ upload images (multipart/form-data) tương tự create
 * - Nếu bạn chỉ muốn cho update JSON, frontend không cần gửi files và multer sẽ bỏ qua
 */
router.put('/:id', uploadProduct.array('images', 10), updateProduct);

/**
 * PATCH /api/admin/products/:id/stock
 * - Cập nhật tồn kho (controller updateStock)
 * - Body JSON (stock, variantId optional)
 */
router.patch('/:id/stock', updateStock);

/**
 * DELETE /api/admin/products/:id
 * - Xóa sản phẩm (soft/hard tuỳ controller)
 */
router.delete('/:id', deleteProduct);

/**
 * Inventory list (nếu bạn muốn tách endpoint)
 * GET /api/admin/products/inventory/list
 */
router.get('/inventory/list', getInventory);

/**
 * Optional: endpoint upload single image and trả về path/url
 * - Useful if you want to upload image first then call createProduct with urls
 * - Route dùng uploadProduct.single('image')
 */
router.post('/upload-image', uploadProduct.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Không có file được upload' });
  // đường dẫn có thể tuỳ cấu hình serve static, ví dụ: /uploads/product/<filename>
  const fileUrl = `/uploads/product/${req.file.filename}`;
  res.status(201).json({ message: 'Upload thành công', file: { filename: req.file.filename, url: fileUrl } });
});

export default router;
