import React from "react";
import { Link } from "react-router-dom";
import { FaStore, FaSignInAlt, FaUserPlus } from "react-icons/fa";

const Home = () => {
  return (
    <div className="container d-flex flex-column justify-content-center align-items-center min-vh-100 text-center">
      {/* Logo + Title */}
      <div className="animate__animated animate__fadeInDown mb-4">
        <FaStore size={80} className="text-primary mb-3" />
        <h1 className="fw-bold text-gradient">Future Tech Store</h1>
        <p className="lead text-muted">
          Nơi công nghệ hội tụ – Khám phá tương lai ngay hôm nay!
        </p>
      </div>

      {/* Buttons */}
      <div className="d-flex gap-3 animate__animated animate__fadeInUp">
        <Link to="/login" className="btn btn-primary btn-lg d-flex align-items-center gap-2">
          <FaSignInAlt /> Đăng nhập
        </Link>
        <Link to="/register" className="btn btn-outline-info btn-lg d-flex align-items-center gap-2">
          <FaUserPlus /> Đăng ký
        </Link>
      </div>
    </div>
  );
};

export default Home;
