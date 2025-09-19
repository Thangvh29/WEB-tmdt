import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/auth/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import SidebarAdmin from "./pages/admin/SidebarAdmin";
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
  

        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
