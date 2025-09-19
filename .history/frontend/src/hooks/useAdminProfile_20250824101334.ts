import { useState, useEffect } from "react";
import axios from "../services/axios";

export const useAdminProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Chưa đăng nhập");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get("/admin/profile/me");
        setProfile(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return { profile, loading, error };
};
