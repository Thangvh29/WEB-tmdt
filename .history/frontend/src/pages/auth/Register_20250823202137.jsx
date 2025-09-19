import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { UserPlus } from "lucide-react";

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    login({ username: form.username, role: "user" });
    navigate("/");
  };

  return (
    <div className="container py-5">
      <div className="card shadow-lg p-4 mx-auto border-0 rounded-4" style={{ maxWidth: "420px" }}>
        <div className="text-center mb-4">
          <UserPlus size={36} className="text-primary" />
          <h3 className="fw-bold">Đăng ký</h3>
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
          <button type="submit" className="btn btn-success w-100 rounded-pill py-2">
            Đăng ký
          </button>
        </form>
        <p className="text-center mt-3">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
