import type { Request, Response, NextFunction } from "express";
import { query, validationResult } from "express-validator";
import { Order } from "../../models/order.model.js";
import { User } from "../../models/user.model.js";
import { Post } from "../../models/post.model.js";
import { Comment } from "../../models/comment.model.js";
import { Cart } from "../../models/cart.model.js";

// ==========================
// 1. Validation
// ==========================
export const dashboardValidation = [
  query("startDate").optional().isISO8601().withMessage("startDate phải là ISO8601"),
  query("endDate").optional().isISO8601().withMessage("endDate phải là ISO8601"),
  query("period")
    .optional()
    .isIn(["today", "week", "month", "year"])
    .withMessage("Period phải là today|week|month|year"),
];

// ==========================
// 2. Helper: Date range
// ==========================
function getDateRangeFromQuery(q: any): { start?: Date; end?: Date } {
  const { startDate, endDate, period } = q;
  if (startDate && endDate) {
    return { start: new Date(startDate), end: new Date(endDate) };
  }
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case "today":
      return { start: startOfDay, end: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000) };
    case "week": {
      const day = now.getDay();
      const start = new Date(startOfDay);
      start.setDate(now.getDate() - day);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      return { start, end };
    }
    case "month":
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      };
    case "year":
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear() + 1, 0, 1),
      };
    default:
      return {};
  }
}

// ==========================
// 3. Controller
// ==========================
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

      // KPI 1: Orders delivered revenue & counts
      const orderMatch: any = { status: "delivered" };
      if (start || end) orderMatch.createdAt = matchDate;

      const revenueAgg = await Order.aggregate([
        { $match: orderMatch },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
            avgOrderValue: { $avg: "$totalAmount" },
          },
        },
      ]);

      const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
      const orderCount = revenueAgg[0]?.orderCount || 0;
      const avgOrderValue = revenueAgg[0]?.avgOrderValue || 0;

      // KPI 2: Orders status breakdown
      const statusBreakdown = await Order.aggregate([
        { $match: start || end ? { createdAt: matchDate } : {} },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);
      const statusMap: Record<string, number> = { delivered: 0, failed: 0, pending: 0, cancelled: 0 };
      statusBreakdown.forEach((s: any) => (statusMap[s._id] = s.count));

      // KPI 3: Top products
      const topProducts = await Order.aggregate([
        { $match: orderMatch },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.product",
            qtySold: { $sum: "$items.quantity" },
            revenue: { $sum: "$items.total" },
          },
        },
        { $sort: { qtySold: -1 } },
        { $limit: 10 },
      ]);

      // KPI 4: New users
      const newUserCount = await User.countDocuments({
        role: { $ne: "admin" },
        ...(start || end ? { createdAt: matchDate } : {}),
      });

      // KPI 5: Active users
      const activeUsersAgg = await Order.aggregate([
        { $match: orderMatch },
        { $group: { _id: "$user" } },
        { $count: "activeUsers" },
      ]);
      const activeUsers = activeUsersAgg[0]?.activeUsers || 0;

      // KPI 6: Posts & Comments
      const postCount = await Post.countDocuments({
        isApproved: true,
        isDeleted: false,
        ...(start || end ? { createdAt: matchDate } : {}),
      });
      const commentCount = await Comment.countDocuments({
        isApproved: true,
        isDeleted: false,
        ...(start || end ? { createdAt: matchDate } : {}),
      });

      // KPI 7: Conversion rate
      const cartsInPeriod = await Cart.countDocuments(start || end ? { createdAt: matchDate } : {});
      const conversionRate = cartsInPeriod > 0 ? (orderCount / cartsInPeriod) * 100 : 0;

      // KPI 8: Revenue by date
      const revenueByDate = await Order.aggregate([
        { $match: orderMatch },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            total: { $sum: "$totalAmount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // KPI 9: Payment method breakdown
      const paymentBreakdown = await Order.aggregate([
        { $match: start || end ? { createdAt: matchDate } : {} },
        { $group: { _id: "$paymentMethod", count: { $sum: 1 }, revenue: { $sum: "$totalAmount" } } },
      ]);

      // KPI 10: Category sales
      const categoryAgg = await Order.aggregate([
        { $match: orderMatch },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.category",
            qty: { $sum: "$items.quantity" },
            revenue: { $sum: "$items.total" },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
      ]);

      // ✅ Always return numbers/mảng (kể cả khi 0)
      return res.json({
        stats: {
          totalRevenue,
          orderCount,
          avgOrderValue,
          statusMap,
          topProducts: topProducts || [],
          newUserCount,
          activeUsers,
          postCount,
          commentCount,
          cartsInPeriod,
          conversionRate: Number(conversionRate.toFixed(2)),
          revenueByDate: revenueByDate || [],
          paymentBreakdown: paymentBreakdown || [],
          categoryAgg: categoryAgg || [],
        },
      });
    } catch (err) {
      console.error("Get dashboard stats error:", err);
      return res.status(500).json({ message: "Lỗi server" });
    }
  },
];
