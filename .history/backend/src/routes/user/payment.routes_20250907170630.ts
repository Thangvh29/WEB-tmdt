import { Router } from "express";
import { protect } from "../../middlewares/protect.js";
import { userOnly } from "../../middlewares/userOnly.js";
import {
  createPayment,
  getPayments,
  getPaymentById,
  paymentCallback,
  createPaymentValidator,
  paymentIdValidator,
} from "../../controllers/user/payment.controller.js";

const router = Router();

// bắt buộc phải đăng nhập mới vào được
router.use(protect);
router.use(userOnly);

// CRUD payment
router.get("/", getPayments);
router.get("/:id", paymentIdValidator, getPaymentById);
router.post("/", createPaymentValidator, createPayment);

// callback từ cổng thanh toán
router.post("/:id/callback", paymentIdValidator, paymentCallback);

export default router;
