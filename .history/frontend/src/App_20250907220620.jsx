// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/auth/Product";
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
import ChatAdmin from "./pages/admin/ChatPage";
import PaymentHistoryPage from "./pages/admin/PaymentHistoryPage";

import SidebarUser from "./pages/user/SidebarUser";
import UserProfile from "./pages/user/UserProfile";
import ProductDetailPage from "./pages/user/ProductDetailPage";
import UserProductsPage from "./pages/user/UserProductsPage";
import UserOrdersPage from "./pages/user/UserOrdersPage";
import UserOrderDetailPage from "./pages/user/UserOrderDetailPage";
import Cart from "./pages/user/Cart";
import UserHomePage from "./pages/user/UserHomePage";
import UserMessagesPage from "./pages/user/UserMessagesPage";
import UserPostPage from "./pages/user/UserPostPage"; // ✅ import thật sự dùng
import UserPaymentPage from "./pages/user/PaymentPage";
import { GoogleOAuthProvider } from "@react-oauth/google";

// Dummy page cho những route chưa làm
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
            <Route path="home" element={<UserHomePage />} />
            <Route path="products" element={<UserProductsPage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="cart" element={<Cart />} />
            <Route path="payment" element={<UserPaymentPage />} />
            <Route path="posts" element={<UserPostPage />} /> {/* ✅ Gọi đúng UserPostPage */}
            <Route path="orders" element={<UserOrdersPage />} />
            <Route path="orders/:id" element={<UserOrderDetailPage />} />
            <Route path="messages" element={<UserMessagesPage />} />
            <Route path="messages/:id" element={<UserMessagesPage />} />
            <Route path="profile" element={<UserProfile />} />
          </Route>

          {/* Admin layout + nested routes */}
          <Route path="/admin" element={<SidebarAdmin />}>
            <Route path="products" element={<ProductsPage />}>
              <Route index element={<ProductListPage />} />
              <Route path="list" element={<ProductListPage />} />
              <Route path="add" element={<ProductAddPage />} />
              <Route path="old" element={<ProductOldListPage />} />
              <Route path="add-old" element={<ProductAddOldPage />} />
            </Route>
            <Route path="orders" element={<OrderManagementPage />}>
              <Route index element={<OrderStatusPage />} />
              <Route path="status" element={<OrderStatusPage />} />
              <Route path="history" element={<OrderHistoryPage />} />
            </Route>
            <Route path="warehouse" element={<InventoryPage title="Quản lý kho hàng" />} />
            <Route path="social" element={<SocialManagementPage title="Quản lý mạng xã hội" />} />
            <Route path="chat" element={<ChatAdmin />} />
            <Route path="stats" element={<Dashboard />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="users" element={<UserManagement title="Quản lý người dùng" />} />
            <Route path="payments/history" element={<PaymentHistoryPage />} />
          </Route>
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
