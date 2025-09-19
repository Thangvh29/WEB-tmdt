import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { UserPlus } from "lucide-react";
import Footer from "../components/Footer";

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (response.ok) {
        // Backend set cookie 'token', lưu user từ data
        login({ email: form.email, role: data.user.role });
        navigate("/");
      } else {
        setError(data.message || "Đăng ký thất bại");
      }
    } catch (err) {
      setError("Lỗi kết nối server");
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="card p-4 col-12 col-md-6 col-lg-4">
        <div className="text-center mb-4">
          <UserPlus size={40} className="text-primary mx-auto" />
          <h3 className="fw-bold">Đăng ký</h3>
        </div>
        {error && <p className="text-danger text-center">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Tên"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              minLength={2}
              maxLength={80}
            />
          </div>
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
          <div className="mb-3">
            <input
              type="tel"
              className="form-control"
              placeholder="Số điện thoại (tùy chọn)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              pattern="^\d{10,11}$"
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Đăng ký
          </button>
        </form>
        <div className="text-center my-3">
          <p className="text-muted">Hoặc đăng ký bằng</p>
          <div className="d-flex flex-column gap-2">
            <a href="/api/auth/google" className="btn btn-social google w-100">Google</a>
            <a href="/api/auth/facebook" className="btn btn-social facebook w-100">Facebook</a>
          </div>
        </div>
        <p className="text-center mt-3 text-muted">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
      <Footer />
    </div>
  );
};

export default Register;