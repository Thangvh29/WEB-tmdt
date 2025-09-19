import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { LogIn } from "lucide-react";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    login({ username: form.username, role: form.username === "admin" ? "admin" : "user" });
    navigate("/");
  };

  return (
    <div className="container py-5">
      <div className="card shadow-lg p-4 mx-auto border-0 rounded-4" style={{ maxWidth: "420px" }}>
        <div className="text-center mb-4">
          <LogIn size={36} className="text-primary" />
          <h3 className="fw-bold">Đăng nhập</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input
              type="text"
              className="form-control form-control-lg rounded-3"
              placeholder="Tên đăng nhập"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              className="form-control form-control-lg rounded-3"
              placeholder="Mật khẩu"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100 rounded-pill py-2">
            Đăng nhập
          </button>
        </form>
        <p className="text-center mt-3">
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
