import { Link, Outlet } from "react-router-dom";

function SidebarAdmin() {
  return (
    <div className="flex">
      {/* Sidebar */}
      <div className="w-64 bg-dark text-white h-screen p-4">
        <h2 className="text-xl fw-bold mb-4">Admin Panel</h2>
        <ul className="list-unstyled">
          <li className="mb-2"><Link to="/admin/products" className="text-white text-decoration-none">Quản lý sản phẩm</Link></li>
          <li className="mb-2"><Link to="/admin/orders" className="text-white text-decoration-none">Quản lý đơn hàng</Link></li>
          <li className="mb-2"><Link to="/admin/warehouse" className="text-white text-decoration-none">Quản lý kho hàng</Link></li>
          <li className="mb-2"><Link to="/admin/social" className="text-white text-decoration-none">Quản lý mạng xã hội</Link></li>
          <li className="mb-2"><Link to="/admin/chat" className="text-white text-decoration-none">Chat</Link></li>
          <li className="mb-2"><Link to="/admin/statistics" className="text-white text-decoration-none">Thống kê doanh thu</Link></li>
          <li className="mb-2"><Link to="/admin/profile" className="text-white text-decoration-none">Quản lý profile</Link></li>
          <li className="mb-2"><Link to="/admin/users" className="text-white text-decoration-none">Quản lý người dùng</Link></li>
          <li className="mt-4"><Link to="/login" className="text-danger fw-bold text-decoration-none">Logout</Link></li>
        </ul>
      </div>

      {/* Nội dung */}
      <div className="flex-1 p-4">
        <Outlet />
      </div>
    </div>
  );
}

export default SidebarAdmin;
