// controllers/order.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import mongoose, { Types } from 'mongoose';
import { Order } from '../../models/order.model.js';
import { Product } from '../../models/product.model.js';
import { User } from '../../models/user.model.js';
import type { AuthRequest } from '../../middlewares/types.js';

// ... giữ nguyên các helper, createOrder, markPaid, cancelOrder, getOrders từ file trước ...

/**
 * VALIDATION: cập nhật thông tin khách hàng trước khi đơn được giao (chưa shipped)
 */
export const updateCustomerInfoValidation = [
  param('id').isMongoId().withMessage('id đơn hàng không hợp lệ'),
  body('phone').optional().trim().matches(/^\d{7,15}$/).withMessage('Số điện thoại không hợp lệ (7-15 chữ số)'),
  body('shippingAddress').optional().trim().isLength({ min: 3 }).withMessage('Địa chỉ không hợp lệ'),
  body('email').optional().isEmail().withMessage('Email không hợp lệ'),
  body('note').optional().trim().isLength({ max: 500 }).withMessage('Ghi chú không được vượt quá 500 ký tự'),
];

/**
 * PATCH /api/orders/:id/customer
 * Cập nhật phone / shippingAddress / email / note trước khi đơn đã "đưa cho bên giao hàng" (shipped)
 */
export const updateCustomerInfo = [
  ...updateCustomerInfoValidation,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const order = await Order.findById(req.params.id);
      if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

      // Only allow edits if order NOT yet shipped
      if (order.status === 'shipped' || order.status === 'delivered' || order.status === 'failed' || order.status === 'cancelled') {
        return res.status(400).json({ message: 'Không thể sửa thông tin khách sau khi đơn đã được chuyển cho bên giao hàng hoặc đã hoàn tất' });
      }

      // Only owner or admin/staff can edit
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      if (String(order.user) !== String(user._id) && !['admin', 'staff'].includes(user.role)) {
        return res.status(403).json({ message: 'Bạn không có quyền sửa đơn này' });
      }

      const { phone, shippingAddress, email, note } = req.body as any;
      if (phone !== undefined) order.phone = phone;
      if (shippingAddress !== undefined) order.shippingAddress = shippingAddress;
      if (email !== undefined) order.email = email;
      if (note !== undefined) order.note = note;

      // Add a statusHistory entry to log that customer info was updated
      order.statusHistory.push({
        status: order.status,
        by: user._id,
        note: `Customer info updated${note ? ': ' + note : ''}`,
        at: new Date(),
      });

      await order.save();
      return res.json({ message: 'Cập nhật thông tin khách hàng thành công', order });
    } catch (err) {
      console.error('Update customer info error:', err);
      next(err);
    }
  },
];

/**
 * UPDATE order status (chỉnh sửa để bắt buộc note khi failed)
 * Replace your previous updateOrderStatus with this version.
 */
export const updateOrderStatus = [
  param('id').isMongoId(),
  body('status')
    .isIn(['pending', 'preparing', 'shipped', 'delivered', 'failed', 'cancelled'])
    .withMessage('Trạng thái không hợp lệ'),
  body('note').optional().trim().isLength({ max: 500 }),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      if (!['admin', 'staff', 'shipper'].includes(user.role)) return res.status(403).json({ message: 'Forbidden' });

      const { status, note } = req.body as any;
      const order = await Order.findById(req.params.id);
      if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

      // Enforce transition rules (state machine)
      const allowed: Record<string, string[]> = {
        pending: ['preparing', 'cancelled'],
        preparing: ['shipped', 'cancelled', 'failed'],
        shipped: ['delivered', 'failed'],
        delivered: [],
        failed: [],
        cancelled: [],
      };
      if (!allowed[order.status].includes(status) && order.status !== status) {
        return res.status(400).json({ message: `Không thể chuyển trạng thái từ ${order.status} -> ${status}` });
      }

      // If failing an order, require a note (reason)
      if (status === 'failed' && (!note || String(note).trim().length === 0)) {
        return res.status(400).json({ message: 'Khi set trạng thái failed cần phải có ghi chú (lý do)' });
      }

      const entry = { status: status as any, by: new Types.ObjectId(user._id), note: note || null, at: new Date() };
      await order.addStatus(entry);

      // if status becomes shipped -> you may lock some fields (handled by updateCustomerInfo checks)
      // if becomes failed/cancelled -> restock items and handle refund placeholder
      if (['failed', 'cancelled'].includes(status)) {
        for (const it of order.items) {
          await Product.findByIdAndUpdate(it.product, { $inc: { stock: it.quantity, sold: -it.quantity } }).exec();
        }
        if (order.paymentStatus === 'paid') {
          // TODO: call payment provider refund
          order.paymentStatus = 'refunded';
          await order.save();
        }
      }

      // when shipped -> you may want to push notification to customer (placeholder)
      // if (status === 'shipped') notifyCustomerShipped(order)

      return res.json({ message: 'Cập nhật trạng thái đơn hàng thành công', order });
    } catch (err) {
      console.error('Update order status error:', err);
      next(err);
    }
  },
];

/**
 * GET /api/orders/history
 * Lấy lịch sử đơn (delivered or failed) - trả thêm lý do failed
 */
export const getOrderHistory = [
  query('success').optional().isBoolean().withMessage('success phải là boolean'),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(100, Number(req.query.limit || 10));
      const success = req.query.success;

      const filter: any = {
        status: { $in: ['delivered', 'failed'] },
      };
      if (success !== undefined) {
        filter.status = success === 'true' || success === true ? 'delivered' : 'failed';
      }

      // If non-admin, restrict to user's own orders (optional)
      if (!(req.user && ['admin', 'staff'].includes(req.user.role))) {
        filter.user = req.user?._id;
      }

      const orders = await Order.find(filter)
        .populate('user', 'name email phone address')
        .populate('items.product', 'name images')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

      const total = await Order.countDocuments(filter);

      // Map orders to include failure reason (if any)
      const mapped = orders.map((o: any) => {
        // find last 'failed' entry in statusHistory (if status is failed)
        let failureReason: string | null = null;
        if (o.status === 'failed' && Array.isArray(o.statusHistory)) {
          const lastFailed = [...o.statusHistory].reverse().find((h: any) => h.status === 'failed' && h.note);
          if (lastFailed) failureReason = lastFailed.note;
        }
        return {
          _id: o._id,
          user: o.user,
          items: o.items,
          totalAmount: o.totalAmount,
          status: o.status,
          note: o.note,
          failureReason,
          shippingAddress: o.shippingAddress,
          phone: o.phone,
          email: o.email,
          createdAt: o.createdAt,
        };
      });

      return res.json({ orders: mapped, total, page, limit });
    } catch (err) {
      console.error('Get order history error:', err);
      next(err);
    }
  },
];
