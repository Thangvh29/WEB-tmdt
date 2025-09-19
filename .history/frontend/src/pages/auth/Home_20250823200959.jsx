import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { Cpu } from "lucide-react";
import { motion } from "framer-motion";

const Home = () => {
  const { user, logout } = useAuth();

  return (
    <div className="container">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <Cpu size={60} className="text-primary mx-auto" />
        <h1 className="text-4xl md:text-5xl font-bold text-gradient">
          Future Tech Store
        </h1>
      </motion.div>

      {user ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card"
        >
          <h4>
            Xin chào, <span className="text-primary">{user.username}</span>
          </h4>
          <p className="text-muted">Role: {user.role}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ background: '#ff4d4d' }}
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
          className="card"
        >
          <h4 className="mb-4">Chào mừng bạn đến với nền tảng công nghệ</h4>
          <div className="flex">
            <Link to="/login" className="button">
              Đăng nhập
            </Link>
            <Link to="/register" className="button outline-button">
              Đăng ký
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Home;