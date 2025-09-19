// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/auth/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import SidebarAdmin from "./pages/admin/SidebarAdmin";
import Dashboard from "./pages/admin/Dashboard";
import UserManagement from "./pages/admin/UserManagement";
import AdminProfile from "./pages/admin/AdminProfile";

import SidebarUser from "./pages/user/SidebarUser";
import { GoogleOAuthProvider } from "@react-oauth/google";

// Import gọn sản phẩm từ index
import {
  ProductsPage,
  ProductListPage,
  ProductAddPage,
  ProductOldListPage,
} from "./pages/admin/products";

// Dummy pages cho test
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
            {/* Quản lý sản phẩm */}
            <Route path="products" element={<ProductsPage />}>
              <Route path="list" element={<ProductListPage />} />
              <Route path="add" element={<ProductAddPage />} />
              <Route path="old" element={<ProductOldListPage />} />
            </Route>

            {/* Các module khác */}
            <Route path="orders" element={<DummyPage title="Quản lý đơn hàng" />} />
            <Route path="warehouse" element={<DummyPage title="Quản lý kho hàng" />} />
            <Route path="social" element={<DummyPage title="Quản lý mạng xã hội" />} />
            <Route path="chat" element={<DummyPage title="Chat" />} />
            <Route path="stats" element={<Dashboard />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="users" element={<UserManagement />} />
          </Route>
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
