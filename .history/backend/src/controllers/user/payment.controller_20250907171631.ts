// src/controllers/user/payment.controller.ts
import type { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { Payment } from "../../models/payment.model.js";
import { Order } from "../../models/order.model.js";

// =============================
// Controllers
// =============================

// [POST] /api/user/payments
export const createPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  try {
    const { orderId, items, amount, method } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // đảm bảo order thuộc về user
    if (order.user.toString() !== (req as any).user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const payment = await Payment.create({
      order: order._id,
      user: (req as any).user._id,
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
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payments = await Payment.find({ user: (req as any).user._id })
      .populate({
        path: "order",
        populate: {
          path: "items.product",
          select: "name image price",
        },
      })
      .sort({ createdAt: -1 });

    // format lại dữ liệu trả về
    const formatted = payments.map((p) => ({
      id: p._id,
      amount: p.amount,
      method: p.method,
      status: p.status,
      createdAt: p.createdAt,
      items: p.order?.items.map((i: any) => ({
        productId: i.product._id,
        name: i.product.name,
        image: i.product.image,
        quantity: i.quantity,
        price: i.product.price,
        subtotal: i.quantity * i.product.price,
      })),
    }));

    return res.json({ data: formatted });
  } catch (err) {
    next(err);
  }
};

// [GET] /api/user/payments/:id
export const getPaymentById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      user: (req as any).user._id,
    }).populate({
      path: "order",
      populate: {
        path: "items.product",
        select: "name image price",
      },
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const formatted = {
      id: payment._id,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      createdAt: payment.createdAt,
      items: payment.order?.items.map((i: any) => ({
        productId: i.product._id,
        name: i.product.name,
        image: i.product.image,
        quantity: i.quantity,
        price: i.product.price,
        subtotal: i.quantity * i.product.price,
      })),
    };

    return res.json({ data: formatted });
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
