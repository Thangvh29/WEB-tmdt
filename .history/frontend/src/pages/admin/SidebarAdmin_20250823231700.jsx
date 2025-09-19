import { NavLink, Outlet } from "react-router-dom";

const SidebarAdmin = () => {
  return (
    <div className="flex">
      {/* Sidebar */}
      <div className="w-64 h-screen bg-gray-900 text-white p-4 space-y-4">
        <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
        <nav className="flex flex-col space-y-2">
          <NavLink to="/admin/products">Quản lý sản phẩm</NavLink>
          <NavLink to="/admin/orders">Quản lý đơn hàng</NavLink>
          <NavLink to="/admin/warehouse">Quản lý kho hàng</NavLink>
          <NavLink to="/admin/social">Quản lý MXH</NavLink>
          <NavLink to="/admin/chat">Chat</NavLink>
          <NavLink to="/admin/statistics">Thống kê</NavLink>
          <NavLink to="/admin/profile">Quản lý profile</NavLink>
          <NavLink to="/admin/users">Quản lý người dùng</NavLink>
          <NavLink to="/login">Logout</NavLink>
        </nav>
      </div>

      {/* Nội dung route con */}
      <div className="flex-1 p-6">
        <Outlet />
      </div>
    </div>
  );
};

export default SidebarAdmin;
