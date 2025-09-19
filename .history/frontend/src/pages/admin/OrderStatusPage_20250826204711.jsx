// frontend/src/pages/admin/OrderStatusPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/axios';
import OrderTable from '../../components/admin/OrderTable';
import OrderDetailModal from '../../components/admin/Orders/OrderDetailModal';
import '../../assets/style/order-list.css'; // Tạo file CSS nếu cần

const OrderStatusPage = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setError('');
      setLoading(true);
      const { data } = await api.get('/admin/orders');
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Lỗi tải danh sách đơn hàng:', err);
      setError(err.response?.data?.message || 'Lỗi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus, note = '') => {
    try {
      await api.put(`/admin/orders/${id}/status`, { status: newStatus, note });
      fetchOrders();
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái:', err);
      setError('Lỗi cập nhật trạng thái');
    }
  };

  const updateCustomerInfo = async (id, updatedInfo) => {
    try {
      await api.patch(`/admin/orders/${id}/customer`, updatedInfo);
      fetchOrders();
      setSelectedOrder(null); // Close modal after update
    } catch (err) {
      console.error('Lỗi cập nhật thông tin khách:', err);
      setError('Lỗi cập nhật thông tin khách');
    }
  };

  return (
    <div className="order-status-page">
      <h3>Trạng thái đơn hàng</h3>
      {error && <p className="error-message">{error}</p>}
      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <OrderTable
          orders={orders.filter(order => ['pending', 'preparing', 'shipped'].includes(order.status))}
          onViewDetail={setSelectedOrder}
          onUpdateStatus={updateStatus}
        />
      )}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={updateStatus}
          onUpdateCustomerInfo={updateCustomerInfo}
        />
      )}
    </div>
  );
};

export default OrderStatusPage;