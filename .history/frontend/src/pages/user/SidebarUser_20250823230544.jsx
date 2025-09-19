import { Link, Outlet } from "react-router-dom";

function SidebarUser() {
  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div className="bg-dark text-white p-4" style={{ width: "250px", minHeight: "100vh" }}>
        <h2 className="fs-4 fw-bold mb-4">User Menu</h2>
        <ul className="list-unstyled">
          <li className="mb-2"><Link to="/user/home" className="text-white text-decoration-none">Trang chủ</Link></li>
          <li className="mb-2"><Link to="/user/products" className="text-white text-decoration-none">Sản phẩm</Link></li>
          <li className="mb-2"><Link to="/user/cart" className="text-white text-decoration-none">Giỏ hàng</Link></li>
          <li className="mb-2"><Link to="/user/payment" className="text-white text-decoration-none">Thanh toán online</Link></li>
          <li className="mb-2"><Link to="/user/posts" className="text-white text-decoration-none">Bài viết</Link></li>
          <li className="mb-2"><Link to="/user/orders" className="text-white text-decoration-none">Theo dõi đơn hàng</Link></li>
          <li className="mb-2"><Link to="/user/messages" className="text-white text-decoration-none">Tin nhắn</Link></li>
          <li className="mb-2"><Link to="/user/profile" className="text-white text-decoration-none">Quản lý profile</Link></li>
          <li className="mt-4"><Link to="/login" className="text-danger fw-bold text-decoration-none">Logout</Link></li>
        </ul>
      </div>

      {/* Nội dung */}
      <div className="flex-grow-1 p-4">
        <Outlet />
      </div>
    </div>
  );
}

export default SidebarUser;
