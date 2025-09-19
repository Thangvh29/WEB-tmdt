// controllers/dashboard.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { query, validationResult } from 'express-validator';
import { Order } from '../../models/order.model.js';
import { User } from '../../models/user.model.js';
import { Post } from '../../models/post.model.js';
import { Comment } from '../../models/comment.model.js';
import { Cart } from '../../models/cart.model.js';
import { Category } from '../../models/category.model.js';
import { Types } from 'mongoose';

// Validation
export const dashboardValidation = [
  query('startDate').optional().isISO8601().withMessage('startDate phải là ISO8601'),
  query('endDate').optional().isISO8601().withMessage('endDate phải là ISO8601'),
  query('period')
    .optional()
    .isIn(['today', 'week', 'month', 'year'])
    .withMessage('Period phải là today|week|month|year'),
];

// Helper: determine date range
function getDateRangeFromQuery(q: any): { start?: Date; end?: Date } {
  const { startDate, endDate, period } = q;
  if (startDate && endDate) {
    return { start: new Date(String(startDate)), end: new Date(String(endDate)) };
  }
  const now = new Date();
  if (!period) return {};
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  switch (period) {
    case 'today':
      return { start: startOf(now), end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) };
    case 'week': {
      // start of week (Sunday) -> adjust if you want Monday
      const day = now.getDay();
      const start = new Date(now);
      start.setDate(now.getDate() - day);
      return { start: startOf(start), end: new Date(startOf(start).getTime() + 7 * 24 * 60 * 60 * 1000) };
    }
    case 'month':
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
    case 'year':
      return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear() + 1, 0, 1) };
    default:
      return {};
  }
}

// Controller
export const getDashboardStats = [
  dashboardValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { start, end } = getDateRangeFromQuery(req.query);
      const matchDate: any = {};
      if (start) matchDate.$gte = start;
      if (end) matchDate.$lt = end;

      // --- KPI 1: Orders delivered revenue & counts ---
      const orderMatch: any = { status: 'delivered' };
      if (start || end) orderMatch.createdAt = matchDate;

      const revenueAgg = await Order.aggregate([
        { $match: orderMatch },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            orderCount: { $sum: 1 },
            avgOrderValue: { $avg: '$totalAmount' },
          },
        },
      ]);
      const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
      const orderCount = revenueAgg[0]?.orderCount || 0;
      const avgOrderValue = revenueAgg[0]?.avgOrderValue || 0;

      // --- KPI 2: Orders statuses breakdown ---
      const statusBreakdown = await Order.aggregate([
        { $match: start || end ? { createdAt: matchDate } : {} },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);
      const statusMap: Record<string, number> = {};
      statusBreakdown.forEach((s: any) => (statusMap[s._id] = s.count));
      const orderStatusStats = statusBreakdown.map((s: any) => ({ status: s._id, count: s.count }));

      // --- KPI 3: Top products ---
      const topProducts = await Order.aggregate([
        { $match: orderMatch },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            qtySold: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.total' },
          },
        },
        { $sort: { qtySold: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            qtySold: 1,
            revenue: 1,
            name: '$product.name',
            images: { $slice: ['$product.images', 1] },
          },
        },
      ]);

      // --- KPI 4: New users count ---
      const userFilter: any = { role: { $ne: 'admin' } };
      if (start || end) userFilter.createdAt = matchDate;
      const newUserCount = await User.countDocuments(userFilter);

      // --- KPI 5: Active users ---
      const activeUsersAgg = await Order.aggregate([
        { $match: orderMatch },
        { $group: { _id: '$user' } },
        { $count: 'activeUsers' },
      ]);
      const activeUsers = activeUsersAgg[0]?.activeUsers || 0;

      // --- KPI 6: Posts & Comments counts ---
      const postFilter: any = { isApproved: true, isDeleted: false };
      const commentFilter: any = { isApproved: true, isDeleted: false };
      if (start || end) {
        postFilter.createdAt = matchDate;
        commentFilter.createdAt = matchDate;
      }
      const postCount = await Post.countDocuments(postFilter);
      const commentCount = await Comment.countDocuments(commentFilter);

      // --- KPI 7: Conversion rate ---
      const cartFilter: any = {};
      if (start || end) cartFilter.createdAt = matchDate;
      const cartsInPeriod = await Cart.countDocuments(cartFilter);
      const conversionRate = cartsInPeriod > 0 ? (orderCount / cartsInPeriod) * 100 : 0;

      // --- KPI 8: Revenue time series (daily) ---
      const revenueByDate = await Order.aggregate([
        { $match: orderMatch },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      const ordersByDate = revenueByDate.map((r) => ({ date: r._id, count: r.count }));

      // --- KPI 9: Payment method breakdown ---
      const paymentBreakdown = await Order.aggregate([
        { $match: start || end ? { createdAt: matchDate } : {} },
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
          },
        },
      ]);

      // --- KPI 10: Category sales ---
      const categoryAgg = await Order.aggregate([
        { $match: orderMatch },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'prod',
          },
        },
        { $unwind: '$prod' },
        {
          $group: {
            _id: '$prod.category',
            qty: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.total' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'cat',
          },
        },
        { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 1, qty: 1, revenue: 1, name: '$cat.name' } },
      ]);

      // --- KPI 11: New users by date ---
      const newUsersByDate = await User.aggregate([
        { $match: userFilter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // --- KPI 12: Revenue by month ---
      const revenueByMonth = await Order.aggregate([
        { $match: orderMatch },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            total: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // --- KPI 13: Products by month ---
      const productsByMonth = await Order.aggregate([
        { $match: orderMatch },
        { $unwind: '$items' },
        {
          $group: {
            _id: {
              month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
              product: '$items.product',
            },
            qty: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.total' },
          },
        },
        { $sort: { '_id.month': 1, qty: -1 } },
      ]);

      // --- KPI 14: Repeat customers ---
      const repeatCustomersAgg = await Order.aggregate([
        { $match: orderMatch },
        { $group: { _id: '$user', orders: { $sum: 1 } } },
        { $match: { orders: { $gte: 2 } } },
        { $count: 'repeatCustomers' },
      ]);
      const repeatCustomers = repeatCustomersAgg[0]?.repeatCustomers || 0;

      // Response
      return res.json({
        stats: {
          totalRevenue,
          orderCount,
          avgOrderValue,
          statusMap,
          orderStatusStats,
          topProducts,
          newUserCount,
          newUsersByDate: newUsersByDate.map((r) => ({ date: r._id, count: r.count })),
          activeUsers,
          postCount,
          commentCount,
          cartsInPeriod,
          conversionRate: Number(conversionRate.toFixed(2)),
          revenueByDate: revenueByDate.map((r) => ({ date: r._id, total: r.total, count: r.count })),
          ordersByDate,
          paymentBreakdown,
          categoryAgg,
          revenueByMonth: revenueByMonth.map((r) => ({ month: r._id, total: r.total, count: r.count })),
          productsByMonth,
          repeatCustomers,
        },
      });
    } catch (err) {
      console.error('Get dashboard stats error:', err);
      return res.status(500).json({ message: 'Lỗi server' });
    }
  },
];

