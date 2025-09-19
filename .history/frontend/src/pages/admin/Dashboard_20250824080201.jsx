import { useEffect, useState } from "react";
import api from "../../services/axios"; // đổi import, dùng instance đã setup
import { Card, CardContent } from "../../components/ui/Card"; 
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/admin/dashboard/stats?period=month");
        setStats(res.data.stats);
      } catch (err) {
        console.error("Fetch dashboard stats error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!stats) return <p>Không có dữ liệu</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📊 Dashboard</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent>
            <p className="text-gray-500">Doanh thu</p>
            <p className="text-xl font-bold">
              {stats.totalRevenue.toLocaleString()} đ
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-gray-500">Đơn hàng</p>
            <p className="text-xl font-bold">{stats.orderCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-gray-500">Người dùng mới</p>
            <p className="text-xl font-bold">{stats.newUserCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Doanh thu theo ngày */}
      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold mb-4">Doanh thu theo ngày</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.revenueByDate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
