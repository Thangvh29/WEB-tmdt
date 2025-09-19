// src/utils/axios.js
import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:5000/api", // chỉnh đúng backend port
});

// Lấy token từ localStorage và gắn vào header
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // lúc login bạn đã lưu token vào localStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
