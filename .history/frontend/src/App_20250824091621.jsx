import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/auth/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import SidebarAdmin from "./pages/admin/SidebarAdmin";
import Dashboard from "./pages/admin/Dashboard";
import UserManagement  from
import SidebarUser from "./pages/user/SidebarUser";
import { GoogleOAuthProvider } from "@react-oauth/google";

// Dummy pages cho test (sau này thay bằng component thật)
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
            <Route path="products" element={<DummyPage title="Quản lý sản phẩm" />} />
            <Route path="orders" element={<DummyPage title="Quản lý đơn hàng" />} />
            <Route path="warehouse" element={<DummyPage title="Quản lý kho hàng" />} />
            <Route path="social" element={<DummyPage title="Quản lý mạng xã hội" />} />
            <Route path="chat" element={<DummyPage title="Chat" />} />
            <Route path="stats" element={<Dashboard />} />   {/* Dashboard nằm trong Thống kê */}
            <Route path="profile" element={<DummyPage title="Quản lý profile" />} />
            <Route path="admin/users" element={<DummyPage title="Quản lý người dùng" />} />
          </Route>

        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
