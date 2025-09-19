import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/auth/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import SidebarAdmin from "./pages/admin/SidebarAdmin";
import SidebarUser from "./pages/user/SidebarUser";
import { GoogleOAuthProvider } from "@react-oauth/google";

function App() {
  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <Router>
        <Routes>
          {/* Auth routes */}
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* User routes */}
          <Route path="/user/*" element={<SidebarUser />} />

          {/* Admin routes */}
          <Route path="/admin/*" element={<SidebarAdmin />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
