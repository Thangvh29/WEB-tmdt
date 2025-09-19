import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { LogIn } from "lucide-react";
import { motion } from "framer-motion";

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
    <div className="min-h-screen flex items-center justify-center py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-900/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700"
      >
        <div className="text-center mb-6">
          <LogIn size={40} className="text-cyan-400 mx-auto" />
          <h3 className="text-2xl font-bold text-white">Đăng nhập</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              className="w-full p-3 bg-gray-800 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Tên đăng nhập"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div className="mb-6">
            <input
              type="password"
              className="w-full p-3 bg-gray-800 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Mật khẩu"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-3 rounded-lg font-semibold"
          >
            Đăng nhập
          </motion.button>
        </form>
        <p className="text-center mt-4 text-gray-400">
          Chưa có tài khoản? <Link to="/register" className="text-cyan-400 hover:text-cyan-300">Đăng ký</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;