import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/auth/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import SidebarAdmin from "./pages/admin/SidebarAdmin";
import Dashboard from "./pages/admin/Dashboard";
import UserManagement from "./pages/admin/UserManagement";
import AdminProfile from "./pages/admin/AdminProfile";
import ProductsPage from "./pages/admin/ProductsPage";
import ProductAddPage from "./pages/admin/ProductAddPage";
import ProductAddOldPage from "./pages/admin/ProductAddOldPage";
import ProductListPage from "./pages/admin/ProductListPage";
import ProductOldListPage from "./pages/admin/ProductOldListPage";
import InventoryPage from "./pages/admin/InventoryPage";
import SocialManagementPage from "./pages/admin/SocialManagementPage";
import OrderManagementPage from "./pages/admin/OrderManagementPage";
import OrderStatusPage from "./pages/admin/OrderStatusPage"; 
import OrderHistoryPage from "./pages/admin/OrderHistoryPage";
import ProductDetailPage from "./pages/user/ProductDetailPage";
import UserProductsPage from "./pages/user/UserProductsPage";
import ChatAdmin from "./pages/admin/ChatPage";

import SidebarUser from "./pages/user/SidebarUser";
import UserProfile from "./pages/user/UserProfile";
import Cart from "./pages/user/Cart";
import { GoogleOAuthProvider } from "@react-oauth/google";

// Dummy pages cho các trang chưa triển khai
const DummyPage = ({ title }) => <h2>{title}</h2>;

function App() {
  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <Router>
        <Routes>
          {/* Auth */}
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* User layout + nested routes */}
          <Route path="/user" element={<SidebarUser />}>
            <Route path="home" element={<DummyPage title="User Home" />} />
            <Route path="products" element={<UserProductsPage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="products" element={<UserProductsPage />} />
            <Route path="payment" element={<DummyPage title="Thanh toán online" />} />
            <Route path="posts" element={<DummyPage title="Bài viết" />} />
            <Route path="orders" element={<DummyPage title="Theo dõi đơn hàng" />} />
            <Route path="messages" element={<DummyPage title="Tin nhắn" />} />
            <Route path="profile" element={<UserProfile/>} />
          </Route>


          {/* Admin layout + nested routes */}
          <Route path="/admin" element={<SidebarAdmin />}>
            <Route path="products" element={<ProductsPage />}>
              <Route index element={<ProductListPage />} /> {/* Mặc định là danh sách sản phẩm */}
              <Route path="list" element={<ProductListPage />} />
              <Route path="add" element={<ProductAddPage />} />
              <Route path="old" element={<ProductOldListPage />} />
              <Route path="add-old" element={<ProductAddOldPage />} /> {/* Thêm sản phẩm cũ */}
            </Route>
            <Route path="orders" element={<OrderManagementPage />}>
              <Route index element={<OrderStatusPage />} /> {/* Mặc định trạng thái */}
              <Route path="status" element={<OrderStatusPage />} />
              <Route path="history" element={<OrderHistoryPage />} />
            </Route>
            <Route path="warehouse" element={<InventoryPage title="Quản lý kho hàng" />} />
            <Route path="social" element={<SocialManagementPage title="Quản lý mạng xã hội" />} />
            <Route path="chat" element={<ChatAdmin />} />
            <Route path="stats" element={<Dashboard />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="users" element={<UserManagement title="Quản lý người dùng" />} />
          </Route>
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;