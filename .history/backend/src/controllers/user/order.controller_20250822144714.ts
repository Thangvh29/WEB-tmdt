// src/controllers/user/order.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { param, query, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import { Order } from '../../models/order.model.js';
import type { AuthRequest } from '../../middlewares/types.js';

// helper
const badReq = (res: Response, errors: any) => res.status(400).json({ errors: errors.array ? errors.array() : errors });

/**
 * GET /api/user/orders
 * List orders for current user (or admin/staff can pass userId query to view other user)
 * query: status (optional), page, limit
 */
export const listOrders = [
  query('status').optional().isIn(['pending', 'preparing', 'shipped', 'delivered', 'failed', 'cancelled']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(100, Number(req.query.limit || 20));
      const skip = (page - 1) * limit;
      const status = req.query.status as string | undefined;

      const filter: any = {};
      if (status) filter.status = status;

      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const isPrivileged = (user as any).role && (['admin', 'staff'].includes((user as any).role));
      if (isPrivileged && req.query.userId) {
        // use new Types.ObjectId(...) to create ObjectId instance
        filter.user = new Types.ObjectId(String(req.query.userId));
      } else {
        filter.user = (user as any)._id ?? user._id;
      }

      const [orders, total] = await Promise.all([
        Order.find(filter)
          .select('-__v')
          .populate('items.product', 'name images price')
          .populate('user', 'name email phone')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        Order.countDocuments(filter).exec(),
      ]);

      const mapped = orders.map((o: any) => ({
        _id: o._id,
        totalAmount: o.totalAmount,
        status: o.status,
        latestStatus: o.statusHistory?.length ? o.statusHistory[o.statusHistory.length - 1] : null,
        itemsCount: o.items?.reduce((s: number, it: any) => s + (it.quantity || 0), 0),
        firstItem: o.items?.[0] ? { name: o.items[0].name, qty: o.items[0].quantity, image: o.items[0].product?.images?.[0] ?? null } : null,
        createdAt: o.createdAt,
      }));

      return res.json({ orders: mapped, total, page, limit });
    } catch (err) {
      console.error('List orders error:', err);
      next(err);
    }
  },
];

/**
 * GET /api/user/orders/:id
 * Get order detail — only owner or admin/staff
 */
export const getOrder = [
  param('id').isMongoId(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const id = req.params.id;
      const order = await Order.findById(id)
        .populate('items.product', 'name images price')
        .populate('user', 'name email phone address')
        .lean()
        .exec();

      if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const isOwner = String(order.user?._id ?? order.user) === String((user as any)._id ?? user._id);
      const isPrivileged = (user as any).role && (['admin', 'staff'].includes((user as any).role));
      if (!isOwner && !isPrivileged) return res.status(403).json({ message: 'Bạn không có quyền xem đơn hàng này' });

      return res.json({ order });
    } catch (err) {
      console.error('Get order error:', err);
      next(err);
    }
  },
];

/**
 * GET /api/user/orders/:id/history
 * Return statusHistory array for the given order (owner or admin/staff)
 */
export const getOrderHistory = [
  param('id').isMongoId(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const id = req.params.id;
      const order = await Order.findById(id).select('status statusHistory user').lean().exec();
      if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const isOwner = String(order.user) === String((user as any)._id ?? user._id);
      const isPrivileged = (user as any).role && (['admin', 'staff'].includes((user as any).role));
      if (!isOwner && !isPrivileged) return res.status(403).json({ message: 'Bạn không có quyền xem lịch sử đơn này' });

      return res.json({ status: order.status, history: order.statusHistory || [] });
    } catch (err) {
      console.error('Get order history error:', err);
      next(err);
    }
  },
];

/**
 * GET /api/user/orders/:id/track
 * Quick tracking info used by frontend "Theo dõi đơn" page.
 */
export const trackOrder = [
  param('id').isMongoId(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const id = req.params.id;
      // include user field so we can check owner
      const order = await Order.findById(id)
        .select('status statusHistory trackingId shippingMethod shippingAddress phone email totalAmount user')
        .lean()
        .exec();

      if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const isOwner = String(order.user ?? '') === String((user as any)._id ?? user._id);
      const isPrivileged = (user as any).role && (['admin', 'staff'].includes((user as any).role));
      if (!isOwner && !isPrivileged) return res.status(403).json({ message: 'Bạn không có quyền theo dõi đơn này' });

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
