// src/layout/UserLayout.jsx
import { Outlet, NavLink } from "react-router-dom";
import {
  Home,
  ShoppingCart,
  CreditCard,
  FileText,
  Truck,
  MessageSquare,
  User,
} from "lucide-react";

const SidebarUser = () => {
  return (
    <div className="w-64 h-screen bg-blue-900 text-white flex flex-col">
      <div className="p-4 text-2xl font-bold border-b border-blue-700">
        User Panel
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <NavLink
          to="/user/home"
          className={({ isActive }) =>
            `flex items-center gap-2 p-2 rounded-lg hover:bg-blue-700 ${
              isActive ? "bg-blue-700" : ""
            }`
          }
        >
          <Home size={18} /> Trang chủ
        </NavLink>
        <NavLink
          to="/user/products"
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-700"
        >
          <ShoppingCart size={18} /> Sản phẩm
        </NavLink>
        <NavLink
          to="/user/cart"
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-700"
        >
          <ShoppingCart size={18} /> Giỏ hàng
        </NavLink>
        <NavLink
          to="/user/payment"
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-700"
        >
          <CreditCard size={18} /> Thanh toán
        </NavLink>
        <NavLink
          to="/user/posts"
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-700"
        >
          <FileText size={18} /> Bài viết
        </NavLink>
        <NavLink
          to="/user/orders"
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-700"
        >
          <Truck size={18} /> Đơn hàng
        </NavLink>
        <NavLink
          to="/user/messages"
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-700"
        >
          <MessageSquare size={18} /> Tin nhắn
        </NavLink>
        <NavLink
          to="/user/profile"
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-700"
        >
          <User size={18} /> Profile
        </NavLink>
      </nav>
    </div>
  );
};

const UserLayout = () => {
  return (
    <div className="flex">
      <SidebarUser />
      <div className="flex-1 p-6 bg-gray-100 min-h-screen overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default UserLayout;
