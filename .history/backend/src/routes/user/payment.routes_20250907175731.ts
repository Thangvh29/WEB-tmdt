//
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
} from "../../validators/payment.validator.js";

const router = Router();

// bắt buộc phải đăng nhập mới vào được
router.use(protect);
router.use(userOnly);

// [GET] /api/user/payments -> danh sách payments của user
router.get("/", getPayments);

// [GET] /api/user/payments/:id -> chi tiết 1 payment
router.get("/:id", paymentIdValidator, getPaymentById);

// [POST] /api/user/payments -> tạo mới payment
router.post("/", createPaymentValidator, createPayment);

// [POST] /api/user/payments/:id/callback -> callback từ cổng thanh toán
router.post("/:id/callback", paymentIdValidator, paymentCallback);

export default router;
