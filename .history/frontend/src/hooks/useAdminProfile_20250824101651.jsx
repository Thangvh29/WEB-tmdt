import { useState, useEffect, useCallback } from "react";
import api from "../services/axios";

export interface AdminProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
}

interface UseAdminProfileReturn {
  profile: AdminProfile;
  loading: boolean;
  message: string;
  avatarFile: File | null;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fetchProfile: () => Promise<void>;
  updateProfile: () => Promise<void>;
}

const useAdminProfile = (): UseAdminProfileReturn => {
  const [profile, setProfile] = useState<AdminProfile>({
    name: "",
    email: "",
    phone: "",
    address: "",
    avatar: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/profile/me");
      setProfile({
        name: data.profile.name || "",
        email: data.profile.email || "",
        phone: data.profile.phone || "",
        address: data.profile.address || "",
        avatar: data.profile.avatar || "",
      });
      setMessage("");
    } catch (err: any) {
      console.error("Không thể lấy profile admin:", err);
      setMessage(err?.response?.data?.message || "Không thể load profile. Vui lòng đăng nhập lại");
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
      setProfile({ ...profile, avatar: URL.createObjectURL(e.target.files[0]) });
    }
  };

  const updateProfile = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("name", profile.name);
      formData.append("email", profile.email);
      formData.append("phone", profile.phone);
      formData.append("address", profile.address);
      if (avatarFile) formData.append("avatar", avatarFile);

      const { data } = await api.put("/admin/profile/me", formData);

      setProfile((prev) => ({
        ...prev,
        avatar: data.profile.avatar || prev.avatar,
      }));
      setAvatarFile(null);
      setMessage(data.message || "Cập nhật thành công");
    } catch (err: any) {
      console.error("Cập nhật profile thất bại:", err);
      setMessage(err?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  }, [profile, avatarFile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    message,
    avatarFile,
    handleChange,
    handleAvatarChange,
    fetchProfile,
    updateProfile,
  };
};

export default useAdminProfile;
