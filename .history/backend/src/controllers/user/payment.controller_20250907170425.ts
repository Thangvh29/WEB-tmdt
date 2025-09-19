// src/controllers/user/payment.controller.ts
import type { Request, Response, NextFunction } from "express";
import { validationResult, body, param } from "express-validator";
import { AuthRequest } from "../../middlewares/protect.js";
import { Payment } from "../../models/payment.model.js";
import { Order } from "../../models/order.model.js";
import { badReq } from "../../utils/error.js";

// =============================
// Validators
// =============================

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

// =============================
// Controllers
// =============================

// [POST] /api/user/payments
export const createPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badReq(res, errors);

  try {
    const { orderId, items, amount, method } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // đảm bảo order thuộc về user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // tạo payment
    const payment = await Payment.create({
      order: order._id,
      user: req.user._id,
      items,
      amount,
      method,
      status: "pending",
    });

    return res.status(201).json({
      message: "Payment created",
      data: payment,
    });
  } catch (err) {
    next(err);
  }
};

// [GET] /api/user/payments
export const getPayments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const payments = await Payment.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    return res.json({ data: payments });
  } catch (err) {
    next(err);
  }
};

// [GET] /api/user/payments/:id
export const getPaymentById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badReq(res, errors);

  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    return res.json({ data: payment });
  } catch (err) {
    next(err);
  }
};

// [POST] /api/user/payments/:id/callback
export const paymentCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status, transactionId } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    payment.status = status || payment.status;
    if (transactionId) payment.transactionId = transactionId;

    await payment.save();

    return res.json({ message: "Payment updated", data: payment });
  } catch (err) {
    next(err);
  }
};
