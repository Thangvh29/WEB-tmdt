import { Router } from "express";
import { protect } from "../../middlewares/protect.js";
import { userOnly } from "../../middlewares/userOnly.js";
import {
  createPayment,
  getPayments,
  getPaymentById,
  paymentCallback,
} from "../../controllers/user/payment.controller.js";
import {
  createPaymentValidator,
  paymentIdValidator,
} from "../../validators/payment.validator.js"; // tách validator riêng

const router = Router();

// yêu cầu user login mới dùng được
router.use(protect);
router.use(userOnly);

// [GET] /api/user/payments -> danh sách payments của user
router.get("/", getPayments);

// [GET] /api/user/payments/:id -> chi tiết payment
router.get("/:id", paymentIdValidator, getPaymentById);

// [POST] /api/user/payments -> tạo payment mới
router.post("/", createPaymentValidator, createPayment);

// [POST] /api/user/payments/:id/callback -> cổng thanh toán gọi về
router.post("/:id/callback", paymentIdValidator, paymentCallback);

export default router;
