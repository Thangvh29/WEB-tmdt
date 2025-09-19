// src/routes/admin/product.routes.ts
import { Router } from "express";
import { protect } from "../../middlewares/protect.js";
import { adminOnly } from "../../middlewares/adminOnly.js";
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

export default router;
