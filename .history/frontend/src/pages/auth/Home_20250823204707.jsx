import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { Cpu, LogIn, UserPlus } from "lucide-react";
import Footer from "./Footer";
import "../../assets/style/home.css";
const Home = () => {
  const { user, logout } = useAuth();

  return (
    <div className="container d-flex flex-column justify-content-center align-items-center min-vh-100 text-center">
      {/* Logo + tiêu đề */}
      <div className="mb-5 animate-fade">
        <Cpu size={90} className="text-primary mb-3 tech-icon-glow" />
        <h1 className="fw-bold display-4 text-gradient mb-3 typing-text">
          Future Tech Store
        </h1>
        <p className="lead text-glow">
          Nơi công nghệ hội tụ – Khám phá tương lai ngay hôm nay!
        </p>
      </div>

      {/* Nếu đã đăng nhập */}
      {user ? (
        <div className="card p-4 col-12 col-md-6 col-lg-4 animate-fade">
          <h4 className="mb-3 text-glow">
            Xin chào, <span className="text-primary">{user.username}</span>
          </h4>
          <p className="text-muted mb-3">Role: {user.role}</p>
          <button className="btn btn-danger w-100" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      ) : (
        // Nếu chưa đăng nhập
        <div className="card p-4 col-12 col-md-6 col-lg-4 animate-fade">
          <h4 className="mb-4 text-glow">
            Chào mừng bạn đến với nền tảng công nghệ
          </h4>
          <div className="d-flex flex-column flex-sm-row gap-3">
            <Link
              to="/login"
              className="btn btn-primary btn-lg d-flex align-items-center justify-content-center gap-2 flex-fill"
            >
              <LogIn size={20} /> Đăng nhập
            </Link>
            <Link
              to="/register"
              className="btn btn-outline-info btn-lg d-flex align-items-center justify-content-center gap-2 flex-fill"
            >
              <UserPlus size={20} /> Đăng ký
            </Link>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
