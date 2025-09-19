import express from "express";
import * as ProductCtrl from "../controllers/user/product.controller.js";

const router = express.Router();

// Public product routes (khách hàng không cần login)
router.get("/new", ProductCtrl.listNewProducts);
router.get("/old", ProductCtrl.listOldProducts);
router.get("/", ProductCtrl.listProducts);
router.get("/filters", ProductCtrl.getProductFilters);
router.get("/:id", ProductCtrl.getProductDetail);
router.get("/:id/related", ProductCtrl.getRelatedProducts);
router.get("/:id/reviews", ProductCtrl.getProductReviews);
router.post("/:id/check-variant", ProductCtrl.checkVariant);

export default router;
