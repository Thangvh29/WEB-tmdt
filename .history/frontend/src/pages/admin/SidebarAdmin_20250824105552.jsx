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
    <div className="d-flex min-vh-100">
      {/* Sidebar */}
      <aside className="bg-white border-end p-3" style={{ width: "250px" }}>
        <div className="d-flex flex-column align-items-center mb-4">
          {/* Sidebar avatar wrapper (small) */}
          <div
            className="sidebar-avatar-wrapper mb-2"
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              overflow: "hidden",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <img
              src={adminProfile?.avatar || "/default-avatar.png"}
              alt="avatar"
              className="sidebar-avatar-img"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                borderRadius: "50%",
              }}
            />
          </div>

          <span className="fw-bold">{adminProfile?.name || "Admin"}</span>
          <small className="text-muted">{adminProfile?.email}</small>
        </div>

        <nav>
          <ul className="list-unstyled">
            {menu.map((item, i) => {
              const isActive = location.pathname === `/admin/${item.path}`;
              return (
                <li key={i} className="mb-2">
                  <Link
                    to={item.path}
                    className={`d-flex align-items-center gap-2 text-decoration-none w-100 p-2 rounded ${
                      isActive ? "bg-primary text-white" : "text-dark"
                    }`}
                    style={{ transition: "background-color .15s" }}
                  >
                    {item.icon} {item.label}
                  </Link>
                </li>
              );
            })}
            <li className="mt-3">
              <button
                onClick={handleLogout}
                className="w-100 d-flex align-items-center justify-content-center gap-2"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  padding: "8px 12px",
                  background: "transparent",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                <LogOut size={18} /> <span>Logout</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-grow-1 p-4 bg-light">
        <Outlet />
      </main>
    </div>
  );
};

export default SidebarAdmin;
