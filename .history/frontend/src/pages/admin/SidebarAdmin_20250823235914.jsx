import { Link, Outlet, useNavigate } from "react-router-dom";
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

  return (
    <div className="d-flex min-vh-100">
      {/* Sidebar */}
      <div className="bg-white border-end p-3" style={{ width: "250px" }}>
        <h4 className="fw-bold mb-4 text-primary">Admin</h4>
        <ul className="list-unstyled">
          {menu.map((item, i) => (
            <li key={i} className="mb-3">
              <Link
                to={item.path}
                className="d-flex align-items-center gap-2 text-decoration-none text-dark fw-semibold"
              >
                {item.icon} {item.label}
              </Link>
            </li>
          ))}
          <li>
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
