// controllers/order.controller.ts
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
          const prod = await Product.findById(it.product).session(session);
          if (!prod) throw new Error(`Sản phẩm không tồn tại: ${it.product}`);

          let unitPrice = prod.price;
          let sku = undefined;
          let snapshotName = prod.name;

          if (it.variant) {
            const v = prod.variants?.id(it.variant);
            if (!v) throw new Error(`Variant không tồn tại: ${it.variant}`);
            if (v.stock < it.quantity) throw new Error(`Không đủ tồn cho product ${prod._id} variant ${it.variant}`);
            unitPrice = v.price;
            sku = v.sku;
            snapshotName = prod.name;
            // decrement variant stock
            v.stock = v.stock - it.quantity;
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
            variant: it.variant ? new Types.ObjectId(it.variant) : undefined,
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
          user: new Types.ObjectId(user._id),
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
  ...updateStatusValidation,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      // only staff/admin/shipper can change status
      if (!['admin', 'staff', 'shipper'].includes(user.role)) return res.status(403).json({ message: 'Forbidden' });

      const { status, note } = req.body;
      const order = await Order.findById(req.params.id);
      if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

      // Optional: enforce allowed transitions
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

      const entry = { status: status as any, by: new Types.ObjectId(user._id), note: note || null, at: new Date() };
      await order.addStatus(entry);

      // If status becomes failed or cancelled AFTER stock already reduced and payment maybe paid:
      if (['failed', 'cancelled'].includes(status)) {
        // 1) restock items (simple approach)
        for (const it of order.items) {
          // increment back stock and decrement sold
          await Product.findByIdAndUpdate(it.product, { $inc: { stock: it.quantity, sold: -it.quantity } }).exec();
        }
        // 2) if paymentStatus === 'paid' -> trigger refund (placeholder)
        if (order.paymentStatus === 'paid') {
          // TODO: call payment provider refund API
          // await paymentService.refund(order._id, order.totalAmount)
          order.paymentStatus = 'refunded';
          await order.save();
        }
      }

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

      await order.addStatus({ status: 'cancelled', by: new Types.ObjectId(user._id), note: req.body.reason || 'User cancelled', at: new Date() });

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
      const mapped = orders.map(o => ({
        _id: o._id,
        user: o.user,
        firstItem: o.items?.[0] ? { name: o.items[0].name, qty: o.items[0].quantity, image: o.items[0].product?.images?.[0] } : null,
        totalAmount: o.totalAmount,
        status: o.status,
        createdAt: o.createdAt,
      }));

      return res.json({ orders: mapped, total, page, limit });
    } catch (err) {
      console.error('Get orders error:', err);
      next(err);
    }
  },
];
