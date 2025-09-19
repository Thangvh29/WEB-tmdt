import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { LogIn } from "lucide-react";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (response.ok) {
        // Backend set cookie 'token', lưu user từ data
        login({ email: form.email, role: data.user.role });  // Giả sử response có data.user
        navigate("/");
      } else {
        setError(data.message || "Đăng nhập thất bại");
      }
    } catch (err) {
      setError("Lỗi kết nối server");
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="card p-4 col-12 col-md-6 col-lg-4">
        <div className="text-center mb-4">
          <LogIn size={40} className="text-primary mx-auto" />
          <h3 className="fw-bold">Đăng nhập</h3>
        </div>
        {error && <p className="text-danger text-center">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input
              type="email"
              className="form-control"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="Mật khẩu"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Đăng nhập
          </button>
        </form>
        <div className="text-center my-3">
          <p className="text-muted">Hoặc đăng nhập bằng</p>
          <div className="d-flex flex-column gap-2">
            <a href="/api/auth/google" className="btn btn-social google w-100">Google</a>
            <a href="/api/auth/facebook" className="btn btn-social facebook w-100">Facebook</a>
          </div>
        </div>
        <p className="text-center mt-3 text-muted">
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
      </div>
      <Footer />
    </div>
  );
};

export default Login;