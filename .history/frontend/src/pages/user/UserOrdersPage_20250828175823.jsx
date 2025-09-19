// frontend/src/pages/user/UserOrdersPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/axios';
import '../../assets/style/user-orders.css'; // Giả sử có file CSS cho styling

const UserOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 20,
  });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      const { data } = await api.get('/user/orders', { params });
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'pending', label: 'Chờ xác nhận' },
    { value: 'preparing', label: 'Đang chuẩn bị' },
    { value: 'shipped', label: 'Đang giao' },
    { value: 'delivered', label: 'Đã giao' },
    { value: 'failed', label: 'Thất bại' },
    { value: 'cancelled', label: 'Đã hủy' },
  ];

  return (
    <div className="user-orders-page">
      <h1>Theo dõi đơn hàng</h1>
      <select name="status" value={filters.status} onChange={handleFilterChange} className="status-filter">
        {statusOptions.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className="orders-list">
          {orders.length === 0 ? (
            <p>Không có đơn hàng nào.</p>
          ) : (
            orders.map((order) => (
              <Link key={order._id} to={`/user/orders/${order._id}`} className="order-card">
                <div className="order-header">
                  <span className={`status-badge status-${order.status}`}>{order.status}</span>
                  <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="order-summary">
                  <img src={order.firstItem?.image || '/default-product.png'} alt="Sản phẩm" className="order-image" />
                  <div className="order-info">
                    <p>{order.firstItem?.name || 'Sản phẩm'} x {order.firstItem?.qty || 0}</p>
                    <p>Tổng: {order.totalAmount} VND</p>
                    <p>Số lượng sản phẩm: {order.itemsCount}</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
      {/* Pagination */}
      <div className="pagination">
        {Array.from({ length: Math.ceil(total / filters.limit) }, (_, i) => (
          <button
            key={i}
            onClick={() => handlePageChange(i + 1)}
            className={filters.page === i + 1 ? 'active' : ''}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default UserOrdersPage;