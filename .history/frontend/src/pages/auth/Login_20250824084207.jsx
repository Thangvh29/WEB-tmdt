import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { LogIn, Home } from "lucide-react";
import Footer from "./Footer";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ Lưu token vào localStorage
        if (data.token) {
          localStorage.setItem("token", data.token);
        }

        // ✅ Cập nhật context
        login({ identifier: form.identifier, role: data.user.role });

        // ✅ Điều hướng
        if (data.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } else {
        setError(data.message || "Đăng nhập thất bại");
      }
    } catch {
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
                  <h5 className="fw-bold m-0">Đăng nhập</h5>
                </div>

                <div className="text-center mb-4">
                  <LogIn size={40} className="text-primary mx-auto" />
                  <h3 className="fw-bold">Chào mừng trở lại</h3>
                </div>

                {error && <p className="text-danger text-center">{error}</p>}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tên hoặc Email"
                      value={form.identifier}
                      onChange={(e) =>
                        setForm({ ...form, identifier: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Mật khẩu"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      required
                      minLength={8}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                  >
                    {loading ? "Đang xử lý..." : "Đăng nhập"}
                  </button>
                </form>

                <div className="text-center my-3">
                  <p className="text-muted">Hoặc đăng nhập bằng</p>
                  <div className="d-flex flex-column gap-2">
                    <a
                      href="http://localhost:5000/api/auth/google"
                      className="btn btn-outline-danger w-100"
                    >
                      Google
                    </a>
                    <a
                      href="http://localhost:5000/api/auth/facebook"
                      className="btn btn-outline-primary w-100"
                    >
                      Facebook
                    </a>
                  </div>
                </div>

                <p className="text-center mt-3 text-muted">
                  Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Login;
