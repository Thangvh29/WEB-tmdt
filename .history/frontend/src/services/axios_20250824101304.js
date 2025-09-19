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
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ Axios response error:", error);

    if (error.response?.status === 401) {
      console.log("🔄 Token hết hạn hoặc không hợp lệ, đang xóa token...");
      localStorage.removeItem("token");

      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
