import { body, param } from "express-validator";

export const createPaymentValidator = [
  body("orderId").notEmpty().withMessage("Order ID is required"),
  body("items").optional().isArray().withMessage("Items must be an array"),
  body("amount").isNumeric().withMessage("Amount must be a number"),
  body("method")
    .isIn(["momo", "vnpay", "zalopay", "paypal", "bank_transfer"])
    .withMessage("Invalid payment method"),
];

export const paymentIdValidator = [
  param("id").isMongoId().withMessage("Invalid payment ID"),
];
