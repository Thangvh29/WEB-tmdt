import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { Cpu } from "lucide-react";
import { motion } from "framer-motion";

const Home = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <Cpu size={60} className="text-cyan-400 mx-auto" />
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Future Tech Store
        </h1>
      </motion.div>

      {user ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-900/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700"
        >
          <h4 className="text-xl font-semibold text-white">
            Xin chào, <span className="text-cyan-400">{user.username}</span>
          </h4>
          <p className="text-gray-400">Role: {user.role}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-4 bg-red-600 text-white py-2 px-6 rounded-lg"
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
          className="bg-gray-900/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700"
        >
          <h4 className="text-xl font-semibold text-white mb-4">
            Chào mừng bạn đến với nền tảng công nghệ
          </h4>
          <div className="flex justify-center gap-4">
            <Link
              to="/login"
              className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-2 px-6 rounded-lg"
            >
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="border border-cyan-400 text-cyan-400 py-2 px-6 rounded-lg hover:bg-cyan-400 hover:text-white transition"
            >
              Đăng ký
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Home;