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
// src/services/axios.js (thay phần response interceptor)
instance.interceptors.response.use(
  (response) => {
    // optional debug
    // console.log("✅ Axios response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("❌ Axios response error:", error?.response?.status, error?.response?.config?.url);

    // Khi gặp 401: chỉ remove token và phát event; không redirect trực tiếp.
    if (error.response?.status === 401) {
      try {
        console.log("🔄 Axios detected 401 — removing token and dispatching app:unauthorized");
        localStorage.removeItem("token");
        window.dispatchEvent(new CustomEvent("app:unauthorized", { detail: { url: error?.config?.url } }));
      } catch (e) {
        console.warn("Could not dispatch unauthorized event:", e);
      }
    }

    return Promise.reject(error);
  }
);

export default instance;

