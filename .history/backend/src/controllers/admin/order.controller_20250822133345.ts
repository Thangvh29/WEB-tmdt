// src/controllers/admin/order.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import mongoose, { Types } from 'mongoose';
import { Order } from '../../models/order.model.js';
import { Product } from '../../models/product.model.js';
import { User } from '../../models/user.model.js';
import type { AuthRequest } from '../../middlewares/types.js';

// Helpers
const badReq = (res: Response, errors: any) => res.status(400).json({ errors: errors.array ? errors.array() : errors });

// --- Create order (server-side snapshot + transaction) ---
export const createOrderValidation = [
  body('items').isArray({ min: 1 }).withMessage('items là mảng và phải có ít nhất 1 item'),
  body('items.*.product').isMongoId().withMessage('product phải là ObjectId'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('quantity >= 1'),
  body('shippingAddress').trim().notEmpty().withMessage('Địa chỉ giao hàng là bắt buộc'),
  body('phone').trim().notEmpty().withMessage('Phone bắt buộc'),
  body('email').trim().isEmail().withMessage('Email không hợp lệ'),
  body('shippingMethod').optional().isIn(['ghn', 'ghtk', 'viettelpost', 'self']),
  body('paymentMethod').optional().isIn(['vnpay', 'momo', 'paypal', 'cod']),
];

export const createOrder = [
  ...createOrderValidation,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      // Build orderData with server-side price & snapshot
      const itemsIn = req.body.items as { product: string; variant?: string; quantity: number }[];
      const itemsSnapshot: any[] = [];

      // start session
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        for (const it of itemsIn) {
          // load product and optional variant
          const prod = await Product.findById(String(it.product)).session(session);
          if (!prod) throw new Error(`Sản phẩm không tồn tại: ${it.product}`);

          let unitPrice = prod.price;
          let sku = undefined;
          let snapshotName = prod.name;

          if (it.variant) {
            // Use find + _id.equals instead of .id() to satisfy TS typing
            const variantObjectId = new Types.ObjectId(String(it.variant));
            const v = (prod.variants ?? []).find((x: any) => x._id && x._id.equals(variantObjectId));
            if (!v) throw new Error(`Variant không tồn tại: ${it.variant}`);
            if ((v.stock ?? 0) < it.quantity) throw new Error(`Không đủ tồn cho product ${prod._id} variant ${it.variant}`);
            unitPrice = v.price;
            sku = v.sku;
            snapshotName = prod.name;
            // decrement variant stock
            v.stock = (v.stock ?? 0) - it.quantity;
          } else {
            // no variant: check product.stock
            if ((prod.stock ?? 0) < it.quantity) throw new Error(`Không đủ tồn cho product ${prod._id}`);
            prod.stock = (prod.stock ?? 0) - it.quantity;
          }

          // increment sold
          prod.sold = (prod.sold ?? 0) + it.quantity;
          await prod.save({ session });

          const total = unitPrice * it.quantity;
          itemsSnapshot.push({
            product: prod._id,
            variant: it.variant ? new Types.ObjectId(String(it.variant)) : undefined,
            name: snapshotName,
            sku,
            quantity: it.quantity,
            price: unitPrice,
            total,
          });
        }

        // compute totals
        const subTotal = itemsSnapshot.reduce((s, it) => s + it.total, 0);
        const shippingFee = Number(req.body.shippingFee ?? 0);
        const discount = Number(req.body.discount ?? 0);
        const totalAmount = Math.max(0, subTotal + shippingFee - discount);

        const orderData: any = {
          user: new Types.ObjectId(String(user._id)),
          items: itemsSnapshot,
          subTotal,
          shippingFee,
          discount,
          totalAmount,
          status: 'pending',
          paymentMethod: req.body.paymentMethod || 'cod',
          paymentStatus: req.body.paymentMethod === 'cod' ? 'unpaid' : 'unpaid',
          shippingAddress: req.body.shippingAddress,
          phone: req.body.phone,
          email: req.body.email,
          shippingMethod: req.body.shippingMethod || 'self',
          note: req.body.note || '',
        };

        // create order doc with session
        const created = await Order.create([orderData], { session });
        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({ message: 'Tạo đơn thành công', order: created[0] });
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
      }
    } catch (err: any) {
      console.error('Create order error:', err);
      // custom errors from stock check => 400
      if (err.message && err.message.startsWith('Không đủ')) return res.status(400).json({ message: err.message });
      return next(err);
    }
  },
];

// --- Update order status (use method addStatus & handle restock/refund) ---
export const updateStatusValidation = [
  param('id').isMongoId(),
  body('status')
    .isIn(['pending', 'preparing', 'shipped', 'delivered', 'failed', 'cancelled'])
    .withMessage('Trạng thái không hợp lệ'),
  body('note').optional().trim().isLength({ max: 500 }),
];

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

      // guard if order.status undefined or not in allowed keys
      const currentStatus = String(order.status || 'pending');
      const allowedNext = allowed[currentStatus] ?? [];
      if (!allowedNext.includes(status) && currentStatus !== status) {
        return res.status(400).json({ message: `Không thể chuyển trạng thái từ ${currentStatus} -> ${status}` });
      }

      // If failing an order, require a note (reason)
      if (status === 'failed' && (!note || String(note).trim().length === 0)) {
        return res.status(400).json({ message: 'Khi set trạng thái failed cần phải có ghi chú (lý do)' });
      }

      const entry = { status: status as any, by: new Types.ObjectId(String(user._id)), note: note || null, at: new Date() };
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


// --- Mark paid (e.g., after payment callback) ---
export const markPaidValidation = [
  param('id').isMongoId(),
  body('txnId').optional().trim(),
  body('provider').optional().trim(),
];

export const markPaid = [
  ...markPaidValidation,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);
    try {
      const order = await Order.findById(req.params.id);
      if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

      order.paymentStatus = 'paid';
      order.statusHistory.push({ status: order.status, by: null, note: `Paid via ${req.body.provider || 'unknown'} ${req.body.txnId || ''}`, at: new Date() });
      await order.save();
      return res.json({ message: 'Đã cập nhật thanh toán', order });
    } catch (err) {
      console.error('Mark paid error:', err);
      next(err);
    }
  },
];

// --- Cancel order by user (only allowed in certain statuses) ---
export const cancelOrder = [
  param('id').isMongoId(),
  body('reason').optional().trim().isLength({ max: 500 }),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const order = await Order.findById(req.params.id);
      if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

      // Only owner can cancel, and only if pending/preparing
      if (String(order.user) !== String(user._id) && user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
      if (!['pending', 'preparing'].includes(order.status)) return res.status(400).json({ message: 'Không thể hủy đơn ở trạng thái này' });

      await order.addStatus({ status: 'cancelled', by: new Types.ObjectId(String(user._id)), note: req.body.reason || 'User cancelled', at: new Date() });

      // restock items
      for (const it of order.items) {
        await Product.findByIdAndUpdate(it.product, { $inc: { stock: it.quantity, sold: -it.quantity } }).exec();
      }

      // if already paid => refund placeholder
      if (order.paymentStatus === 'paid') {
        order.paymentStatus = 'refunded';
        await order.save();
        // TODO: trigger actual refund via payment provider
      }

      return res.json({ message: 'Hủy đơn thành công', order });
    } catch (err) {
      console.error('Cancel order error:', err);
      next(err);
    }
  },
];

// --- Get orders list & history (improved projection) ---
export const getOrders = [
  query('status').optional().isIn(['pending', 'preparing', 'shipped', 'delivered', 'failed', 'cancelled']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);
    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(100, Number(req.query.limit || 10));
      const filter: any = {};
      if (req.query.status) filter.status = req.query.status;

      // If non-admin, restrict to user's own orders
      if (!(req.user && ['admin', 'staff'].includes(req.user.role))) {
        filter.user = req.user?._id;
      }

      const orders = await Order.find(filter)
        .populate('user', 'name email phone')
        .populate('items.product', 'name images')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

      const total = await Order.countDocuments(filter);
      // map projection for card UI (first item preview)
      const mapped = (orders as any[]).map(o => {
        const firstItem = o.items?.[0];
        const firstImage = firstItem ? ((firstItem.product as any)?.images?.[0] ?? null) : null;
        return {
          _id: o._id,
          user: o.user,
          firstItem: firstItem ? { name: firstItem.name, qty: firstItem.quantity, image: firstImage } : null,
          totalAmount: o.totalAmount,
          status: o.status,
          createdAt: o.createdAt,
        };
      });

      return res.json({ orders: mapped, total, page, limit });
    } catch (err) {
      console.error('Get orders error:', err);
      next(err);
    }
  },
];

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
      const successRaw = req.query.success;
      const filter: any = {
        status: { $in: ['delivered', 'failed'] },
      };
      if (successRaw !== undefined) {
        const succ = String(successRaw).toLowerCase() === 'true';
        filter.status = succ ? 'delivered' : 'failed';
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
      const mapped = (orders as any[]).map((o: any) => {
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

// --- Get single order detail ---
export const getOrderDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'Missing order id' });

    const order = await Order.findById(id)
      .populate('user', 'name email phone address')
      .populate('items.product', 'name images price')
      .lean();

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    return res.json({ order });
  } catch (err) {
    console.error('Get order detail error:', err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};
