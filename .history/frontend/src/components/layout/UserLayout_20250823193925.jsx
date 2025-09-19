import { Link, Outlet } from "react-router-dom";

export default function UserLayout() {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 text-white flex flex-col p-4">
        <Link to="/" className="mb-4 text-xl font-bold">E-Store</Link>
        <nav className="flex flex-col gap-2">
          <Link to="/">Trang chủ</Link>
          <Link to="/products">Sản phẩm</Link>
          <Link to="/cart">Giỏ hàng</Link>
          <Link to="/orders">Theo dõi đơn</Link>
          <Link to="/posts">Bài viết</Link>
          <Link to="/messages">Tin nhắn</Link>
          <Link to="/profile">Profile</Link>
          <Link to="/logout">Logout</Link>
        </nav>
      </aside>

      {/* Nội dung */}
      <main className="flex-1 overflow-y-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}
