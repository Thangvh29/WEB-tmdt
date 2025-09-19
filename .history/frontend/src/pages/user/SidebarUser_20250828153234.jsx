// src/components/SidebarUser.jsx
import { useState, useEffect } from "react";
import api from "../../services/axios";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  ShoppingCart,
  Heart,
  CreditCard,
  FileText,
  Truck,
  MessageSquare,
  User,
  LogOut,
} from "lucide-react";
import "../../assets/style/sidebar-admin.css";

const SidebarUser = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userProfile, setUserProfile] = useState(null);

  const menu = [
    { icon: <Home size={18} />, label: "Trang chủ", path: "home" },
    { icon: <ShoppingCart size={18} />, label: "Sản phẩm", path: "products" },
    { icon: <ShoppingCart size={18} />, label: "Giỏ hàng", path: "cart" },
    { icon: <CreditCard size={18} />, label: "Thanh toán online", path: "payment" },
    { icon: <FileText size={18} />, label: "Bài viết", path: "posts" },
    { icon: <Truck size={18} />, label: "Theo dõi đơn hàng", path: "orders" },
    { icon: <MessageSquare size={18} />, label: "Tin nhắn", path: "messages" },
    { icon: <User size={18} />, label: "Quản lý profile", path: "profile" },
  ];

  useEffect(() => {
  const fetchUserProfile = async () => {
    try {
      // đúng endpoint backend
      const { data } = await api.get("/user/profile/me");
      // backend trả về { user: { ... } }
      setUserProfile(data.user);
    } catch (err) {
      console.error("Không thể lấy profile user:", err);
      if (err?.response && err.response.status === 401) {
        localStorage.removeItem("token");
        if (!window.location.pathname.includes("/login")) navigate("/login");
      }
    }
  };
  fetchUserProfile();
}, [navigate]);


  const handleLogout = () => {
    localStorage.clear();
    // nếu có endpoint logout trên server, có thể call ở đây
    navigate("/login");
  };

  return (
    <div className="sidebar-admin">
      <aside className="sidebar-admin__aside" role="navigation" aria-label="User sidebar">
        <div className="sidebar-admin__profile" title={userProfile?.name || "User"}>
          <div className="sidebar-admin__avatar" aria-hidden>
            <img
  src={userProfile?.avatar ? `${backendURL}${userProfile.avatar}` : "/default-avatar.png"}
  alt="avatar"
/>
          </div>
          <div className="sidebar-admin__name">{userProfile?.name || "Khách"}</div>
          <div className="sidebar-admin__email">{userProfile?.email || ""}</div>
        </div>

        <ul className="sidebar-admin__nav" role="menu">
          {menu.map((item, i) => {
            const isActive = location.pathname === `/user/${item.path}`;
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

export default SidebarUser;
