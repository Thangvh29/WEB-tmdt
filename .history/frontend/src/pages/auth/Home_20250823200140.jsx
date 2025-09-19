import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { Cpu } from "lucide-react";

const Home = () => {
  const { user, logout } = useAuth();

  return (
    <div className="container py-5 text-center">
      <div className="mb-4">
        <Cpu size={48} className="text-primary" />
        <h1 className="fw-bold text-gradient">Future Tech Store</h1>
      </div>

      {user ? (
        <div className="card shadow p-4 border-0 rounded-4">
          <h4>Xin chào, <span className="text-primary">{user.username}</span></h4>
          <p className="text-muted">Role: {user.role}</p>
          <button className="btn btn-danger mt-3" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      ) : (
        <div className="card shadow p-4 border-0 rounded-4">
          <h4 className="mb-3">Chào mừng bạn đến với nền tảng công nghệ</h4>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/login" className="btn btn-primary rounded-pill px-4">
              Đăng nhập
            </Link>
            <Link to="/register" className="btn btn-outline-primary rounded-pill px-4">
              Đăng ký
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
