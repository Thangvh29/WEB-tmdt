// frontend/src/pages/admin/OrderManagementPage.jsx
import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import '../../assets/style/admin-orders.css'; // Tạo file CSS nếu cần

const OrderManagementPage = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('status');

  const tabs = [
    { label: 'Trạng thái đơn hàng', path: '/admin/orders/status', key: 'status' },
    { label: 'Lịch sử đơn hàng', path: '/admin/orders/history', key: 'history' },
  ];

  return (
    <div className="order-management-page">
      <h2>Quản lý đơn hàng</h2>
      <div className="tabs">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            to={tab.path}
            className={`tab ${location.pathname === tab.path ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <Outlet />
    </div>
  );
};

export default OrderManagementPage;