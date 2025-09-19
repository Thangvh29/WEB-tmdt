// src/pages/admin/Dashboard.jsx
import { useEffect, useState } from "react";
import api from "../../services/axios.js";
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
      } catch (err) {
        console.error(err);
        setError("Lỗi tải dữ liệu dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="p-4">⏳ Đang tải...</div>;
  if (error) return <div className="p-4 text-danger">{error}</div>;
  if (!stats) return <p className="p-4">Không có dữ liệu</p>;

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <div className="container-fluid">
      <div className="row align-items-center mb-4">
        <div className="col-12 d-flex justify-content-between align-items-center">
          <h1 className="h4 mb-0">📊 Dashboard</h1>
        </div>
      </div>

      {/* KPI cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <small className="text-muted">Doanh thu</small>
              <div className="h4 fw-bold mt-2">
                {(stats.totalRevenue ?? 0).toLocaleString()} đ
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <small className="text-muted">Đơn hàng</small>
              <div className="h4 fw-bold mt-2">{stats.orderCount ?? 0}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <small className="text-muted">Người dùng mới</small>
              <div className="h4 fw-bold mt-2">{stats.newUserCount ?? 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts - each row holds 1 or 2 charts depending on width */}
      <div className="row g-3 mb-3">
        {/* Revenue by date - full width on small, half on large */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title mb-3">Doanh thu theo ngày</h5>
              {stats.revenueByDate?.length > 0 ? (
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.revenueByDate}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted">Không có dữ liệu biểu đồ</p>
              )}
            </div>
          </div>
        </div>

        {/* Orders by date */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title mb-3">Đơn hàng theo ngày</h5>
              {stats.ordersByDate?.length > 0 ? (
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.ordersByDate}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted">Không có dữ liệu biểu đồ</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pie + Area below */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title mb-3">Tỷ lệ đơn hàng theo trạng thái</h5>
              {stats.orderStatusStats?.length > 0 ? (
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.orderStatusStats}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius="60%"
                        label={(entry) => entry.status}
                      >
                        {stats.orderStatusStats.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend layout="horizontal" verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted">Không có dữ liệu biểu đồ</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title mb-3">Người dùng mới theo ngày</h5>
              {stats.newUsersByDate?.length > 0 ? (
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.newUsersByDate}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted">Không có dữ liệu biểu đồ</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
