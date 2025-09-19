// src/services/axios.js
import axios from "axios";

export const backendURL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const instance = axios.create({
  baseURL: `${backendURL}/api`,
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.dispatchEvent(
        new CustomEvent("app:unauthorized", { detail: { url: error?.config?.url } })
      );
    }
    return Promise.reject(error);
  }
);

export default instance;
