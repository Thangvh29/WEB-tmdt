// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/auth/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import SidebarUser from "./pages/user/SidebarUser";
import { GoogleOAuthProvider } from "@react-oauth/google";

// Import gọn từ admin/index.js
import {
  SidebarAdmin,
  Dashboard,
  UserManagement,
  AdminProfile,
  ProductsPage,
  ProductListPage,
  ProductAddPage,
  ProductOldListPage,
} from ".";

// Dummy cho user
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
            <Route path="products" element={<DummyPage title="User Products" />} />
            <Route path="cart" element={<DummyPage title="User Cart" />} />
            <Route path="payment" element={<DummyPage title="Thanh toán online" />} />
            <Route path="posts" element={<DummyPage title="Bài viết" />} />
            <Route path="orders" element={<DummyPage title="Theo dõi đơn hàng" />} />
            <Route path="messages" element={<DummyPage title="Tin nhắn" />} />
            <Route path="profile" element={<DummyPage title="Quản lý profile" />} />
          </Route>

          {/* Admin layout + nested routes */}
          <Route path="/admin" element={<SidebarAdmin />}>
            {/* Quản lý sản phẩm (nested trong ProductsPage) */}
            <Route path="products" element={<ProductsPage />}>
              <Route path="list" element={<ProductListPage />} />
              <Route path="add" element={<ProductAddPage />} />
              <Route path="old" element={<ProductOldListPage />} />
            </Route>

            <Route path="orders" element={<DummyPage title="Quản lý đơn hàng" />} />
            <Route path="warehouse" element={<DummyPage title="Quản lý kho hàng" />} />
            <Route path="social" element={<DummyPage title="Quản lý mạng xã hội" />} />
            <Route path="chat" element={<DummyPage title="Chat" />} />
            <Route path="stats" element={<Dashboard />} /> {/* Dashboard = thống kê */}
            <Route path="profile" element={<AdminProfile />} />
            <Route path="users" element={<UserManagement />} />
          </Route>
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
