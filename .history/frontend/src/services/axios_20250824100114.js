// src/services/axios.js
import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Request interceptor - gắn token vào header
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    console.log("🔐 Axios request interceptor - token từ localStorage:", token);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("✅ Axios request - đã gắn Authorization header:", config.headers.Authorization);
    } else {
      console.log("❌ Axios request - không có token trong localStorage");
    }
    
    return config;
  },
  (error) => {
    console.error("❌ Axios request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor - xử lý lỗi authentication
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("❌ Axios response error:", error);
    
    // Nếu lỗi 401 (Unauthorized) thì xóa token và redirect về login
    if (error.response?.status === 401) {
      console.log("🔄 Token hết hạn hoặc không hợp lệ, đang xóa token...");
      localStorage.removeItem("token");
      
      // Redirect về login page nếu không phải đang ở trang login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default instance;