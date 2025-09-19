// src/routes/user/order.routes.ts
import { Router } from "express";
import { protect } from "../../middlewares/protect.js";
import { userOnly } from "../../middlewares/userOnly.js";
import {
  listOrders,
  getOrder,
  getOrderHistory,
  trackOrder,
} from "../../controllers/user/order.controller.js";

const router = Router();

// bắt buộc phải đăng nhập mới vào được
router.use(protect);
router.use(userOnly);

router.get("/", listOrders);
router.get("/:id", getOrder);
router.get("/:id/history", getOrderHistory);
router.get("/:id/track", trackOrder);

export default router;
