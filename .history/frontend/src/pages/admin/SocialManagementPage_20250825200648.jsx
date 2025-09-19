// src/pages/admin/SocialManagementPage.jsx
import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import "../../assets/style/admin-products.css"; // dùng style tab giống ProductsPage
import "../../assets/style/product-list.css";   // grid/card
import "../../assets/style/inventory-admin.css"; // nếu có

const SocialManagementPage = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("admin-posts");

  const tabs = [
    { label: "Đăng bài", path: "/admin/social/admin-posts", key: "admin-posts" },
    { label: "Quản lý bài viết", path: "/admin/social/user-posts", key: "user-posts" },
  ];

  return (
    <div className="social-management-page">
      <h2>Quản lý mạng xã hội</h2>
      <div className="tabs">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            to={tab.path}
            className={`tab ${location.pathname === tab.path ? "active" : ""}`}
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

export default SocialManagementPage;
