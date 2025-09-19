import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "../components/ui/Card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    chartData: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/statistics");
        // Nếu API không có dữ liệu thì vẫn fallback về 0
        setStats({
          totalUsers: res.data.totalUsers ?? 0,
          totalOrders: res.data.totalOrders ?? 0,
          totalRevenue: res.data.totalRevenue ?? 0,
          chartData: res.data.chartData?.length ? res.data.chartData : [{ name: "No data", value: 0 }],
        });
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardContent>
          <h3>Người dùng</h3>
          <p>{stats.totalUsers}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <h3>Đơn hàng</h3>
          <p>{stats.totalOrders}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <h3>Doanh thu</h3>
          <p>{stats.totalRevenue} ₫</p>
        </CardContent>
      </Card>

      <div className="col-span-3 bg-white p-4 rounded shadow">
        <h3>Biểu đồ thống kê</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats.chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
