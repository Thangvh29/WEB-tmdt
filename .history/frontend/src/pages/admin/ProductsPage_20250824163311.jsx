// src/pages/admin/ProductsPage.jsx
import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import '../../assets/style/admin-products.css'; // Giả sử có file CSS

const ProductsPage = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('list');

  const tabs = [
    { label: 'Danh mục sản phẩm', path: '/admin/products/list', key: 'list' },
    { label: 'Thêm sản phẩm', path: '/admin/products/add', key: 'add' },
    { label: 'Danh mục sản phẩm cũ', path: '/admin/products/old', key: 'old' },
    {}
  ];

  return (
    <div className="products-page">
      <h2>Quản lý sản phẩm</h2>
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

export default ProductsPage;