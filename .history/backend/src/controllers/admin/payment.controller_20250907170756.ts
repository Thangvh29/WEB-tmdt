import type { Request, Response, NextFunction } from "express";
import { query, param, validationResult } from "express-validator";
import { Payment } from "../../models/payment.model.js";
import { User } from "../../models/user.model.js";
import { Order } from "../../models/order.model.js";

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
    .isIn(["pending", "success", "failed", "refunded"])
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

      const filter: any = {};
      if (req.query.status) filter.status = req.query.status;
      if (req.query.method) filter.method = req.query.method;

      const payments = await Payment.find(filter)
        .populate("user", "name email")
        .populate("order", "totalAmount status")
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
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
        .populate("user", "name email phone")
        .populate("order", "items totalAmount status paymentStatus")
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
// Lịch sử giao dịch thành công/thất bại
// =============================
export const getPaymentHistory = [
  query("success").optional().isBoolean().withMessage("success phải là boolean"),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1 }).toInt(),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(100, Number(req.query.limit || 20));

      const successRaw = req.query.success;
      const filter: any = {
        status: { $in: ["success", "failed", "refunded"] },
      };
      if (successRaw !== undefined) {
        const succ = String(successRaw).toLowerCase() === "true";
        filter.status = succ ? "success" : "failed";
      }

      const payments = await Payment.find(filter)
        .populate("user", "name email phone")
        .populate("order", "totalAmount status")
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

      const total = await Payment.countDocuments(filter);

      return res.json({ payments, total,
