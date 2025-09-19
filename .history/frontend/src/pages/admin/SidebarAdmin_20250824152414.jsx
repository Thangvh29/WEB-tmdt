// src/pages/admin/SidebarAdmin.jsx
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
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import "../../assets/style/sidebar-admin.css";

const SidebarAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [adminProfile, setAdminProfile] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);

  const menu = [
    {
      icon: <Package size={20} />,
      label: "Quản lý sản phẩm",
      path: "products",
      children: [
        { label: "Danh sách", path: "list" },
        { label: "Thêm sản phẩm", path: "add" },
        { label: "Hàng cũ", path: "old" },
      ],
    },
    { icon: <ShoppingCart size={20} />, label: "Quản lý đơn hàng", path: "orders" },
    { icon: <Warehouse size={20} />, label: "Kho hàng", path: "warehouse" },
    { icon: <Share2 size={20} />, label: "Mạng xã hội", path: "social" },
    { icon: <MessageSquare size={20} />, label: "Chat", path: "chat" },
    { icon: <BarChart3 size={20} />, label: "Thống kê", path: "stats" },
    { icon: <User size={20} />, label: "Profile", path: "profile" },
    { icon: <Users size={20} />, label: "Người dùng", path: "users" },
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
    navigate("/login");
  };

  const toggleMenu = (label) => {
    setOpenMenu(openMenu === label ? null : label);
  };

  return (
    <div className="sidebar-admin">
      <aside className="sidebar-admin__aside">
        <div className="sidebar-admin__profile">
          <div className="sidebar-admin__avatar">
            <img src={adminProfile?.avatar || "/default-avatar.png"} alt="avatar" />
          </div>
          <div className="sidebar-admin__name">{adminProfile?.name || "Admin"}</div>
          <div className="sidebar-admin__email">{adminProfile?.email || ""}</div>
        </div>

        <ul className="sidebar-admin__nav">
          {menu.map((item, i) => {
            const isActive = location.pathname.startsWith(`/admin/${item.path}`);
            const hasChildren = item.children && item.children.length > 0;

            return (
              <li key={i} className="sidebar-admin__nav-item">
                <div
                  className={`sidebar-admin__link ${isActive ? "sidebar-admin__link--active" : ""}`}
                  onClick={() => (hasChildren ? toggleMenu(item.label) : navigate(`/admin/${item.path}`))}
                >
                  {item.icon}
                  <span className="sidebar-admin__label">{item.label}</span>
                  {hasChildren &&
                    (openMenu === item.label ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                </div>

                {hasChildren && openMenu === item.label && (
                  <ul className="sidebar-admin__submenu">
                    {item.children.map((child, j) => {
                      const childPath = `/admin/${item.path}/${child.path}`;
                      const isChildActive = location.pathname === childPath;
                      return (
                        <li key={j}>
                          <Link
                            to={childPath}
                            className={`sidebar-admin__sublink ${
                              isChildActive ? "sidebar-admin__sublink--active" : ""
                            }`}
                          >
                            {child.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>

        <div className="sidebar-admin__logout">
          <button onClick={handleLogout} className="sidebar-admin__logout-button">
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
