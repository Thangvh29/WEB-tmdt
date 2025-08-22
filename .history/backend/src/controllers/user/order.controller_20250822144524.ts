// src/controllers/user/order.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { query, param, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import { Order } from '../../models/order.model.js';
import type { AuthRequest } from '../../middlewares/types.js';

const badReq = (res: Response, errors: any) => res.status(400).json({ errors: errors.array ? errors.array() : errors });

/**
 * GET /api/user/orders
 * List current user's orders (paginated) with brief info for each order.
 * Query params:
 *   - page, limit
 *   - status (optional) to filter by order status
 *   - from, to (optional ISO dates) to filter by createdAt range
 */
export const getUserOrders = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn(['pending', 'preparing', 'shipped', 'delivered', 'failed', 'cancelled']),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(50, Number(req.query.limit || 12));
      const skip = (page - 1) * limit;

      const filter: any = { user: (user as any)._id ?? user._id };

      if (req.query.status) filter.status = req.query.status;
      if (req.query.from || req.query.to) {
        filter.createdAt = {};
        if (req.query.from) filter.createdAt.$gte = new Date(String(req.query.from));
        if (req.query.to) filter.createdAt.$lte = new Date(String(req.query.to));
      }

      const [orders, total] = await Promise.all([
        Order.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .select('items subTotal shippingFee discount totalAmount status paymentStatus shippingAddress phone email trackingId createdAt')
          .lean()
          .exec(),
        Order.countDocuments(filter).exec(),
      ]);

      // Map to UI-friendly shape: first item preview, items minimal
      const mapped = orders.map((o: any) => ({
        _id: o._id,
        totalAmount: o.totalAmount,
        subTotal: o.subTotal,
        shippingFee: o.shippingFee,
        discount: o.discount,
        status: o.status,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt,
        trackingId: o.trackingId ?? null,
        shippingAddress: o.shippingAddress,
        phone: o.phone,
        email: o.email,
        // first item preview: name, qty, price, image (if snapshot or product ref not populated)
        firstItem: o.items && o.items.length > 0 ? {
          name: o.items[0].name || null,
          qty: o.items[0].quantity,
          price: o.items[0].price,
        } : null,
        itemsCount: o.items?.length || 0,
      }));

      return res.json({ orders: mapped, total, page, limit });
    } catch (err) {
      console.error('Get user orders error:', err);
      next(err);
    }
  },
];

/**
 * GET /api/user/orders/:id
 * Return full order detail for the owner (or 404)
 */
export const getUserOrderDetail = [
  param('id').isMongoId().withMessage('order id không hợp lệ'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const id = req.params.id;
      const order = await Order.findById(id)
        .select('-__v')
        .lean()
        .exec();

      if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

      // ensure owner
      if (String(order.user) !== String((user as any)._id ?? user._id)) {
        return res.status(403).json({ message: 'Bạn không có quyền xem đơn hàng này' });
      }

      // Return order: items included (they contain product snapshot fields from your model)
      return res.json({ order });
    } catch (err) {
      console.error('Get user order detail error:', err);
      next(err);
    }
  },
];
/**
 * GET /api/user/orders/:id/track
 * Quick tracking info used by frontend "Theo dõi đơn" page.
 * Returns simplified timeline + trackingId + current status + shippingMethod
 */
export const trackOrder = [
  param('id').isMongoId(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const id = req.params.id;
      const order = await Order.findById(id).select('status statusHistory trackingId shippingMethod shippingAddress phone email totalAmount').lean().exec();
      if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const isOwner = String(order.user ?? '') === String((user as any)._id ?? user._id);
      const isPrivileged = (user as any).role && (['admin', 'staff'].includes((user as any).role));
      if (!isOwner && !isPrivileged) return res.status(403).json({ message: 'Bạn không có quyền theo dõi đơn này' });

      // Build timeline: map statusHistory to an ordered timeline
      const timeline = (order.statusHistory || [])
        .map((h: any) => ({ status: h.status, note: h.note || null, by: h.by || null, at: h.at }))
        .sort((a: any, b: any) => new Date(a.at).getTime() - new Date(b.at).getTime());

      return res.json({
        status: order.status,
        trackingId: order.trackingId || null,
        shippingMethod: order.shippingMethod || null,
        timeline,
        contact: { phone: order.phone, email: order.email },
        shippingAddress: order.shippingAddress,
        totalAmount: order.totalAmount,
      });
    } catch (err) {
      console.error('Track order error:', err);
      next(err);
    }
  },
];