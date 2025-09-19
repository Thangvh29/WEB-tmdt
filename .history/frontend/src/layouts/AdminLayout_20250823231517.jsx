import { Outlet, NavLink } from "react-router-dom";
import { BarChart3, ShoppingCart, Users, Package } from "lucide-react";

const SidebarAdmin = () => {
  return (
    <div className="w-64 h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-4 text-2xl font-bold border-b border-gray-700">
        Admin Panel
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700 ${
              isActive ? "bg-gray-700" : ""
            }`
          }
        >
          <BarChart3 size={18} /> Dashboard
        </NavLink>
        <NavLink
          to="/admin/orders"
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700"
        >
          <ShoppingCart size={18} /> Orders
        </NavLink>
        <NavLink
          to="/admin/products"
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700"
        >
          <Package size={18} /> Products
        </NavLink>
        <NavLink
          to="/admin/users"
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700"
        >
          <Users size={18} /> Users
        </NavLink>
      </nav>
    </div>
  );
};

const AdminLayout = () => {
  return (
    <div className="flex">
      <SidebarAdmin />
      <div className="flex-1 p-6 bg-gray-100 min-h-screen overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
