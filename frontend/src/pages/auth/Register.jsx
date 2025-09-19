import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { UserPlus, Home } from "lucide-react"; // thêm icon
import Footer from "./Footer";

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (response.ok) {
        login({ email: form.email, role: data.user.role });
        navigate("/");
      } else {
        setError(data.message || "Đăng ký thất bại");
      }
    } catch{
      setError("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Main form */}
      <main className="flex-fill d-flex justify-content-center align-items-center">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-sm-8 col-md-6 col-lg-4">
              <div className="card shadow-lg p-4 rounded-4">
                {/* Nút quay lại Home */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <button
                    className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                    onClick={() => navigate("/")}
                  >
                    <Home size={16} /> Trang chủ
                  </button>
                  <h5 className="fw-bold m-0">Đăng ký</h5>
                </div>

                <div className="text-center mb-4">
                  <UserPlus size={40} className="text-primary mx-auto" />
                  <h3 className="fw-bold">Tạo tài khoản</h3>
                </div>

                {error && <p className="text-danger text-center">{error}</p>}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tên"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
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
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Mật khẩu (tối thiểu 8 ký tự)"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
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
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      pattern="^\d{10,11}$"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                  >
                    {loading ? "Đang xử lý..." : "Đăng ký"}
                  </button>
                </form>

                <div className="text-center my-3">
                  <p className="text-muted">Hoặc đăng ký bằng</p>
                  <div className="d-flex flex-column gap-2">
                    <a
                      href="/api/auth/google"
                      className="btn btn-outline-danger w-100"
                    >
                      Google
                    </a>
                    <a
                      href="/api/auth/facebook"
                      className="btn btn-outline-primary w-100"
                    >
                      Facebook
                    </a>
                  </div>
                </div>

                <p className="text-center mt-3 text-muted">
                  Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer luôn dưới cùng */}
      <Footer />
    </div>
  );
};

export default Register;
