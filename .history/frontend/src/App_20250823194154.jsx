import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
//import AdminDashboard from "./pages/admin/Dashboard";
//import UserHome from "./pages/user/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

      </Routes>
    </Router>
  );
}

export default App;
