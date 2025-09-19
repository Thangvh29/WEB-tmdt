// frontend/src/pages/admin/OrderHistoryPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/axios';
import OrderTable from '../../components/admin/OrderTable';
import OrderDetailModal from '../../components/a/Orders/OrderDetailModal';
import '../../assets/style/order-list.css';

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setError('');
      setLoading(true);
      const { data } = await api.get('/admin/orders/history/list');
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Lỗi tải lịch sử đơn hàng:', err);
      setError(err.response?.data?.message || 'Lỗi tải lịch sử đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-history-page">
      <h3>Lịch sử đơn hàng</h3>
      {error && <p className="error-message">{error}</p>}
      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <OrderTable
          orders={orders}
          onViewDetail={setSelectedOrder}
          showFailureReason={true} // Để hiển thị lý do thất bại
        />
      )}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          isHistory={true} // Disable edit/update in history mode
        />
      )}
    </div>
  );
};

export default OrderHistoryPage;