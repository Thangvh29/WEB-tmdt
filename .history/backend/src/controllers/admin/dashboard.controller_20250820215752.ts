import type { Request, Response, NextFunction } from 'express';
import { query, validationResult } from 'express-validator';
import { Order } from '../../models/order.model.js';
import { User } from '../../models/user.model.js';
import { Post } from '../../models/post.model.js';
import { Comment } from '../../models/comment.model.js';

// Validation cho truy vấn thống kê
export const dashboardValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate phải là định dạng ngày hợp lệ (ISO 8601)'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate phải là định dạng ngày hợp lệ (ISO 8601)'),
  query('period')
    .optional()
    .isIn(['today', 'week', 'month', 'year'])
    .withMessage('Period phải là today, week, month hoặc year'),
];

// Lấy dữ liệu dashboard
export const getDashboardStats = [
  dashboardValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { startDate, endDate, period } = req.query;

      // Xác định khoảng thời gian
      let dateFilter: any = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string),
        };
      } else if (period) {
        const now = new Date();
        switch (period) {
          case 'today':
            dateFilter.createdAt = {
              $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            };
            break;
          case 'week':
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
            dateFilter.createdAt = { $gte: startOfWeek };
            break;
          case 'month':
            dateFilter.createdAt = {
              $gte: new Date(now.getFullYear(), now.getMonth(), 1),
            };
            break;
          case 'year':
            dateFilter.createdAt = {
              $gte: new Date(now.getFullYear(), 0, 1),
            };
            break;
        }
      }

      // Tính doanh thu (chỉ tính đơn hàng delivered)
      const orders = await Order.find({
        ...dateFilter,
        status: 'delivered',
      });
      const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const orderCount = orders.length;

      // Đếm người dùng mới (không phải admin)
      const userCount = await User.countDocuments({
        ...dateFilter,
        role: { $ne: 'admin' },
      });

      // Đếm bài đăng đã duyệt
      const postCount = await Post.countDocuments({
        ...dateFilter,
        isApproved: true,
        isDeleted: false,
      });

      // Đếm bình luận đã duyệt
      const commentCount = await Comment.countDocuments({
        ...dateFilter,
        isApproved: true,
        isDeleted: false,
      });

      // Thống kê doanh thu theo ngày (cho biểu đồ, nếu cần)
      const revenueByDate = await Order.aggregate([
        {
          $match: {
            ...dateFilter,
            status: 'delivered',
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            total: { $sum: '$totalAmount' },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      res.json({
        stats: {
          totalRevenue,
          orderCount,
          userCount,
          postCount,
          commentCount,
          revenueByDate: revenueByDate.map((item) => ({
            date: item._id,
            total: item.total,
          })),
        },
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },
];