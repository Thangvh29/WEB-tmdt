// frontend/src/pages/user/UserOrderDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/axios';
import '../../assets/style/user-order-detail.css'; // Giả sử CSS

const UserOrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrderTrack();
  }, [id]);

  const fetchOrderTrack = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/user/orders/${id}/track`);
      setOrder(data);
    } catch (err) {
      setError('Không tìm thấy đơn hàng hoặc bạn không có quyền xem');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Đang tải...</p>;
  const params = {};
  
  if (!order) return null;

  return (
    <div className="user-order-detail-page">
      <h1>Chi tiết đơn hàng</h1>
      <p>Trạng thái: <span className={`status-badge status-${order.status}`}>{order.status}</span></p>
      <p>Tổng tiền: {order.totalAmount} VND</p>
      <p>Địa chỉ giao: {order.shippingAddress}</p>
      <p>Số điện thoại: {order.contact.phone}</p>
      <p>Email: {order.contact.email}</p>
      {order.trackingId && <p>Mã theo dõi: {order.trackingId}</p>}
      {order.shippingMethod && <p>Phương thức vận chuyển: {order.shippingMethod}</p>}

      <h2>Lịch sử trạng thái</h2>
      <div className="timeline">
        {order.timeline.map((entry, index) => (
          <div key={index} className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <p className="timeline-status">{entry.status}</p>
              <p className="timeline-note">{entry.note || 'Không có ghi chú'}</p>
              <p className="timeline-date">{new Date(entry.at).toLocaleString()}</p>
              {entry.by && <p className="timeline-by">Cập nhật bởi: {entry.by}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserOrderDetailPage;