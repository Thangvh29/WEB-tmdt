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

  // Fetch thông tin admin hiện tại
  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const { data } = await axios.get("/api/admin/profile/me");
        setAdminProfile(data.profile);
      } catch (err) {
        console.error("Không thể lấy profile admin:", err);
      }
    };
    fetchAdminProfile();
  }, []);

  return (
    <div className="d-flex min-vh-100">
      {/* Sidebar */}
      <div className="bg-white border-end p-3" style={{ width: "250px" }}>
        <div className="d-flex flex-column align-items-center mb-4">
          <img
            src={adminProfile?.avatar || "/default-avatar.png"}
            alt="avatar"
            className="w-16 h-16 rounded-full mb-2 object-cover"
          />
          <span className="fw-bold">{adminProfile?.name || "Admin"}</span>
          <small className="text-muted">{adminProfile?.email}</small>
        </div>

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
                >
                  {item.icon} {item.label}
                </Link>
              </li>
            );
          })}
          <li className="mt-3">
            <button
              onClick={() => {
                localStorage.clear();
                navigate("/login");
              }}
              className="btn btn-light d-flex align-items-center gap-2 w-100"
            >
              <LogOut size={20} /> Logout
            </button>
          </li>
        </ul>
      </div>

      {/* Main content */}
      <div className="flex-grow-1 p-4 bg-light">
        <Outlet />
      </div>
    </div>
  );
};

export default SidebarAdmin;
