import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { Cpu } from "lucide-react";
import { motion } from "framer-motion";

const Home = () => {
  const { user, logout } = useAuth();

  return (
    <div className="container d-flex flex-column justify-content-center align-items-center min-vh-100 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="mb-5"
      >
        <Cpu size={80} className="text-primary mb-3" />
        <h1 className="fw-bold text-gradient display-4">Future Tech Store</h1>
        <p className="lead text-muted">
          Nơi công nghệ hội tụ – Khám phá tương lai ngay hôm nay!
        </p>
      </motion.div>

      {user ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card p-4"
        >
          <h4 className="mb-3">
            Xin chào, <span className="text-primary">{user.username}</span>
          </h4>
          <p className="text-muted mb-3">Role: {user.role}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-danger"
            onClick={logout}
          >
            Đăng xuất
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card p-4"
        >
          <h4 className="mb-4">Chào mừng bạn đến với nền tảng công nghệ</h4>
          <div className="d-flex flex-column flex-sm-row gap-3">
            <Link to="/login" className="btn btn-primary btn-lg d-flex align-items-center gap-2">
              <i className="bi bi-box-arrow-in-right"></i> Đăng nhập
            </Link>
            <Link to="/register" className="btn btn-outline-info btn-lg d-flex align-items-center gap-2">
              <i className="bi bi-person-plus"></i> Đăng ký
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Home;