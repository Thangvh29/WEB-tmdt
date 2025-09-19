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
} from "recharts";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log("🔍 Dashboard - Bắt đầu fetch stats...");
        
        // Kiểm tra token trong localStorage
        const token = localStorage.getItem("token");
        console.log("🔑 Dashboard - Token trong localStorage:", token ? "Có token" : "Không có token");
        
        if (!token) {
          setError("Không có token xác thực");
          return;
        }

        const res = await api.get("/admin/dashboard/stats?period=month");
        console.log("✅ Dashboard - Response:", res.data);
        setStats(res.data.stats);
        setError(null);
      } catch (err) {
        console.error("❌ Dashboard - Fetch error:", err);
        console.error("❌ Dashboard - Error response:", err.response?.data);
        console.error("❌ Dashboard - Error status:", err.response?.status);
        
        if (err.response?.status === 401) {
          setError("Không có quyền truy cập. Vui lòng đăng nhập lại.");
        } else if (err.code === 'ERR_NETWORK') {
          setError("Lỗi kết nối mạng. Kiểm tra CORS và server backend.");
        } else {
          setError(`Lỗi: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  if (loading) return <div className="p-4">⏳ Đang tải...</div>;
  
  if (error) return (
    <div className="p-4">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Lỗi:</strong> {error}
      </div>
      <div className="mt-4">
        <h3 className="font-bold">Debug info:</h3>
        <ul className="list-disc list-inside">
          <li>Token trong localStorage: {localStorage.getItem("token") ? "✅ Có" : "❌ Không có"}</li>
          <li>Frontend URL: {window.location.origin}</li>
          <li>API URL: http://localhost:5000/api</li>
        </ul>
      </div>
    </div>
  );
  
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
      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold mb-4">Doanh thu theo ngày</h2>
          {stats.revenueByDate && stats.revenueByDate.length > 0 ? (
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
    </div>
  );
};

export default Dashboard;