import axios from "axios";

// Tạo instance axios
const instance = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Request interceptor
instance.interceptors.request.use(
  async (config) => {
    // Luôn lấy token mới nhất trước mỗi request
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

// Response interceptor
// src/services/axios.js (response interceptor)
instance.interceptors.response.use(
  (response) => {
    // optional: log success for debugging
    // console.log('✅ Axios response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("❌ Axios response error:", error);

    if (error.response?.status === 401) {
      console.log("🔄 Axios detected 401 — removing token but NOT auto-redirecting (debug).");
      localStorage.removeItem("token");

      // Option A: dispatch event so App can redirect in a controlled way
      window.dispatchEvent(new CustomEvent("app:unauthorized"));
    }

    return Promise.reject(error);
  }
);


export default instance;
