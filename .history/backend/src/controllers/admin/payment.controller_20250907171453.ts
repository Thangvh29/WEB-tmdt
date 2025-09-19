// src/controllers/admin/payment.controller.ts
import type { Request, Response, NextFunction } from "express";
import { query, param, validationResult } from "express-validator";
import { Payment } from "../../models/payment.model.js";
import { User } from "../../models/user.model.js";
import { Order } from "../../models/order.model.js";
import { Types } from "mongoose";

// Helpers
const badReq = (res: Response, errors: any) =>
  res.status(400).json({ errors: errors.array ? errors.array() : errors });

// =============================
// GET /api/admin/payments
// Lấy danh sách payments (có filter, pagination)
// =============================
export const getPayments = [
  query("status")
    .optional()
    .isIn(["pending", "success", "failed", "refunded", "cancelled"])
    .withMessage("Trạng thái không hợp lệ"),
  query("method")
    .optional()
    .isIn(["momo", "vnpay", "zalopay", "paypal", "bank_transfer"])
    .withMessage("Phương thức không hợp lệ"),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1 }).toInt(),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(100, Number(req.query.limit || 20));
      const skip = (page - 1) * limit;

      const filter: any = {};
      if (req.query.status) filter.status = req.query.status;
      if (req.query.method) filter.method = req.query.method;

      // populate user (name/email) and order basic info
      const payments = await Payment.find(filter)
        .populate("user", "name email")
        .populate("order", "totalAmount status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Payment.countDocuments(filter);

      return res.json({ payments, total, page, limit });
    } catch (err) {
      console.error("Get payments error:", err);
      next(err);
    }
  },
];

// =============================
// GET /api/admin/payments/:id
// Lấy chi tiết một payment
// =============================
export const getPaymentDetail = [
  param("id").isMongoId().withMessage("ID không hợp lệ"),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const payment = await Payment.findById(req.params.id)
        .populate("user", "name email phone avatar address")
        .populate({
          path: "order",
          select: "items totalAmount status paymentStatus",
          populate: { path: "items.product", select: "name images price" },
        })
        .lean();

      if (!payment) {
        return res.status(404).json({ message: "Không tìm thấy giao dịch" });
      }

      return res.json({ payment });
    } catch (err) {
      console.error("Get payment detail error:", err);
      next(err);
    }
  },
];

// =============================
// GET /api/admin/payments/history
// Lịch sử giao dịch chi tiết theo sản phẩm (có thể filter theo productId)
// Trả về danh sách record: user (avatar/name/email/address), paidAt, product (image/name), qty, amount
// =============================
export const getPaymentHistory = [
  query("success").optional().isBoolean().withMessage("success phải là boolean"),
  query("productId").optional().isMongoId().withMessage("productId không hợp lệ"),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1 }).toInt(),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(100, Number(req.query.limit || 20));
      const start = (page - 1) * limit;

      // base filter on payment.status
      const successRaw = req.query.success;
      let statusFilter: any = { $in: ["success", "failed", "refunded", "cancelled"] };
      if (successRaw !== undefined) {
        const succ = String(successRaw).toLowerCase() === "true";
        statusFilter = succ ? "success" : "failed";
      }

      const paymentFilter: any = { status: statusFilter };

      // load payments with populated order/items.product and user info
      const rawPayments = await Payment.find(paymentFilter)
        .populate("user", "name email avatar address")
        .populate({
          path: "order",
          select: "items totalAmount status",
          populate: { path: "items.product", select: "name images price" },
        })
        .sort({ createdAt: -1 })
        .lean();

      // optional product filter (filter payments whose order contains that product)
      let filtered = rawPayments;
      if (req.query.productId) {
        const productId = String(req.query.productId);
        filtered = filtered.filter((p: any) => {
          return p.order && Array.isArray(p.order.items) && p.order.items.some((it: any) => {
            // it.product may be populated object or ObjectId
            const prodId = it.product?._id ? String(it.product._id) : String(it.product);
            return prodId === productId;
          });
        });
      }

      const total = filtered.length;

      // paginate in JS (we already sorted)
      const pagePayments = filtered.slice(start, start + limit);

      // format each record to the UI-friendly structure
      const formatted = pagePayments.flatMap((p: any) => {
        // find items relevant to requested productId (or all items if no productId)
        const relevantItems = p.order?.items?.filter((it: any) => {
          if (!req.query.productId) return true;
          const prodId = it.product?._id ? String(it.product._id) : String(it.product);
          return prodId === String(req.query.productId);
        }) || [];

        // map each item to a record (one row per product in the payment)
        return relevantItems.map((it: any) => {
          const productObj = it.product || null;
          const image = productObj?.images?.[0] ?? null; // product.images is array in schema
          const name = it.name || productObj?.name || "";
          const qty = it.quantity ?? it.qty ?? 0;
          // price should come from order item snapshot (it.price) not product.price
          const unitPrice = typeof it.price === "number" ? it.price : (productObj?.price ?? 0);
          const subtotal = typeof it.total === "number" ? it.total : unitPrice * qty;
          const paidAt = p.status === "success" ? (p.updatedAt ?? p.createdAt) : p.createdAt;

          return {
            paymentId: p._id,
            paidAt,
            paymentStatus: p.status,
            paymentMethod: p.method,
            user: {
              name: p.user?.name ?? null,
              email: p.user?.email ?? null,
              avatar: p.user?.avatar ?? null,
              address: p.user?.address ?? null,
            },
            product: {
              _id: productObj?._id ?? null,
              name,
              image,
            },
            quantity: qty,
            unitPrice,
            amount: subtotal,
            orderId: p.order?._id ?? null,
          };
        });
      });

      return res.json({ payments: formatted, total, page, limit });
    } catch (err) {
      console.error("Get payment history error:", err);
      next(err);
    }
  },
];
