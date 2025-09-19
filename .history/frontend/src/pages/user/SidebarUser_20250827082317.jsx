import { NavLink, Outlet } from "react-router-dom";
import "../../assets/style/sidebar-admin.css";
const SidebarUser = () => {
  return (
    <div className="flex">
      {/* Sidebar */}
      <div className="w-64 h-screen bg-blue-900 text-white p-4 space-y-4">
        <h2 className="text-xl font-bold mb-4">User Menu</h2>
        <nav className="flex flex-col space-y-2">
          <NavLink to="/user/home">Trang chủ</NavLink>
          <NavLink to="/user/products">Sản phẩm</NavLink>
          <NavLink to="/user/cart">Giỏ hàng</NavLink>
          <NavLink to="/user/payment">Thanh toán online</NavLink>
          <NavLink to="/user/posts">Bài viết</NavLink>
          <NavLink to="/user/orders">Theo dõi đơn hàng</NavLink>
          <NavLink to="/user/messages">Tin nhắn</NavLink>
          <NavLink to="/user/profile">Quản lý profile</NavLink>
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

export default SidebarUser;
