// src/components/SidebarAdmin.jsx
import { useState, useEffect } from "react";
import api from "../../services/axios";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Package,
  ShoppingCart,
  Warehouse,
  Users,
  BarChart3,
  MessageSquare,
  User,
  LogOut,
  Share2,
} from "lucide-react";
import "../../assets/style/sidebar-admin.css";

const SidebarAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [adminProfile, setAdminProfile] = useState(null);

  const menu = [
    { icon: <Package size={20} />, label: "Quản lý sản phẩm", path: "products" },
    { icon: <ShoppingCart size={20} />, label: "Quản lý đơn hàng", path: "orders" },
    { icon: <Warehouse size={20} />, label: "Kho hàng", path: "warehouse" },
    { icon: <Share2 size={20} />, label: "Mạng xã hội", path: "social" },
    { icon: <MessageSquare size={20} />, label: "Chat", path: "chat" },
    { icon: <BarChart3 size={20} />, label: "Thống kê", path: "stats" },
    { icon: <User size={20} />, label: "Profile", path: "profile" },
    { icon: <Users size={20} />, label: "Người dùng", path: "users" },

    { icon: <ShoppingCart size={20} />, label: "Lịch sử thanh toán", path: "payments/history" },
  ];


  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const { data } = await api.get("/admin/profile/me");
        setAdminProfile(data.profile);
      } catch (err) {
        console.error("Không thể lấy profile admin:", err);
        if (err?.response && err.response.status === 401) {
          localStorage.removeItem("token");
          if (!window.location.pathname.includes("/login")) navigate("/login");
        }
      }
    };
    fetchAdminProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    // optional: call server logout endpoint if exists
    navigate("/login");
  };

  return (
    <div className="sidebar-admin">
      <aside className="sidebar-admin__aside" role="navigation" aria-label="Admin sidebar">
        <div className="sidebar-admin__profile" title={adminProfile?.name || "Admin"}>
          <div className="sidebar-admin__avatar" aria-hidden>
            <img src={adminProfile?.avatar || "/default-avatar.png"} alt="avatar" />
          </div>
          <div className="sidebar-admin__name">{adminProfile?.name || "Admin"}</div>
          <div className="sidebar-admin__email">{adminProfile?.email || ""}</div>
        </div>

        <ul className="sidebar-admin__nav" role="menu">
          {menu.map((item, i) => {
            const isActive = location.pathname === `/admin/${item.path}`;
            return (
              <li key={i} className="sidebar-admin__nav-item" role="none">
                <Link
                  to={item.path}
                  role="menuitem"
                  data-tooltip={item.label}
                  className={`sidebar-admin__link ${isActive ? "sidebar-admin__link--active" : ""}`}
                >
                  {item.icon}
                  <span className="sidebar-admin__label">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="sidebar-admin__logout">
          <button
            onClick={handleLogout}
            className="sidebar-admin__logout-button"
            data-tooltip="Logout"
            aria-label="Logout"
          >
            <LogOut size={18} />
            <span className="sidebar-admin__label">Logout</span>
          </button>
        </div>
      </aside>

      <main className="sidebar-admin__content">
        <Outlet />
      </main>
    </div>
  );
};

export default SidebarAdmin;
