import { useEffect, useState } from "react";
import api from "../../services/axios.js";
import { Card, CardContent } from "../../components/ui/Card"; 
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Không có token xác thực");
          return;
        }
        const res = await api.get("/admin/dashboard/stats?period=month");
        setStats(res.data.stats);
        setError(null);
      } catch  {
        setError("Lỗi tải dữ liệu dashboard");
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  if (loading) return <div className="p-4">⏳ Đang tải...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!stats) return <p>Không có dữ liệu</p>;

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📊 Dashboard</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent>
            <p className="text-gray-500">Doanh thu</p>
            <p className="text-xl font-bold">
              {stats.totalRevenue?.toLocaleString() || 0} đ
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-gray-500">Đơn hàng</p>
            <p className="text-xl font-bold">{stats.orderCount || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-gray-500">Người dùng mới</p>
            <p className="text-xl font-bold">{stats.newUserCount || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Doanh thu theo ngày */}
      <Card className="mb-6">
        <CardContent>
          <h2 className="text-lg font-semibold mb-4">Doanh thu theo ngày</h2>
          {stats.revenueByDate?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.revenueByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500">Không có dữ liệu biểu đồ</p>
          )}
        </CardContent>
      </Card>

      {/* Đơn hàng theo ngày */}
      <Card className="mb-6">
        <CardContent>
          <h2 className="text-lg font-semibold mb-4">Đơn hàng theo ngày</h2>
          {stats.ordersByDate?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.ordersByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500">Không có dữ liệu biểu đồ</p>
          )}
        </CardContent>
      </Card>

      {/* Tỷ lệ đơn hàng theo trạng thái */}
      <Card className="mb-6">
        <CardContent>
          <h2 className="text-lg font-semibold mb-4">Tỷ lệ đơn hàng theo trạng thái</h2>
          {stats.orderStatusStats?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.orderStatusStats}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {stats.orderStatusStats.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500">Không có dữ liệu biểu đồ</p>
          )}
        </CardContent>
      </Card>

      {/* Người dùng mới theo ngày */}
      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold mb-4">Người dùng mới theo ngày</h2>
          {stats.newUsersByDate?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.newUsersByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500">Không có dữ liệu biểu đồ</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
