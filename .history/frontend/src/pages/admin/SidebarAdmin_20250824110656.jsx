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
  Menu,
} from "lucide-react";

const SidebarAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [adminProfile, setAdminProfile] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen">
      {/* Mobile menu toggle */}
      <button
        className="lg:hidden p-4"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[var(--sidebar-bg)] border-r p-4 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="flex flex-col items-center mb-6">
          <div className="sidebar-avatar-wrapper">
            <img
              src={adminProfile?.avatar || "/default-avatar.png"}
              alt="avatar"
              className="sidebar-avatar-img"
            />
          </div>
          <span className="font-semibold mt-2">{adminProfile?.name || "Admin"}</span>
          <small className="text-gray-500">{adminProfile?.email}</small>
        </div>

        <nav>
          <ul className="list-unstyled space-y-2">
            {menu.map((item, i) => {
              const isActive = location.pathname === `/admin/${item.path}`;
              return (
                <li key={i}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      isActive
                        ? "bg-[var(--primary)] text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    } transition-colors duration-200`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    {item.icon} {item.label}
                  </Link>
                </li>
              );
            })}
            <li className="mt-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-lg text-gray-700 border border-[var(--border)] hover:bg-gray-100 transition-colors"
              >
                <LogOut size={18} /> <span>Logout</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 bg-[var(--background)] lg:ml-64">
        <Outlet />
      </main>
    </div>
  );
};

export default SidebarAdmin;