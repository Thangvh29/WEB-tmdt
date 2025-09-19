// src/components/profile/ProfileForm.jsx
import { useEffect, useState, useRef } from "react";
import api from "../../services/axios";
import { Button } from "../ui/button";

const DEFAULT_AVATAR = "/default-avatar.png"; // đặt trong public folder FE

const ProfileForm = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    avatar: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Bạn cần đăng nhập để xem profile");
        return;
      }

      try {
        const { data } = await api.get("/admin/profile/me");
        setForm({
          name: data.profile.name || "",
          email: data.profile.email || "",
          phone: data.profile.phone || "",
          address: data.profile.address || "",
          avatar: data.profile.avatar || "",
        });
        setMessage("");
      } catch (err) {
        console.error("Không thể lấy profile admin:", err);
        setMessage("Không thể load profile. Vui lòng đăng nhập lại");
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // optional: validate size/type here
      setAvatarFile(file);
      setForm({ ...form, avatar: URL.createObjectURL(file) });
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("address", form.address);
      if (avatarFile) formData.append("avatar", avatarFile);

      // QUAN TRỌNG: không set Content-Type thủ công — axios tự xử lý boundary
      const { data } = await api.put("/admin/profile/me", formData);

      // cập nhật avatar từ response (server trả URL đầy đủ)
      setForm((prev) => ({
        ...prev,
        avatar: data.profile.avatar || prev.avatar,
      }));
      setAvatarFile(null);
      setMessage(data.message || "Cập nhật thành công");
    } catch (err) {
      console.error("Cập nhật profile thất bại:", err);
      setMessage(err?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setLoading(false);
      // revoke preview URL nếu cần (ngăn leak)
      if (avatarFile) URL.revokeObjectURL(avatarFile);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-6 mt-8 sm:p-8">
      <h2 className="text-2xl font-semibold text-center text-gray-800 mb-4">
        Quản lý Profile Admin
      </h2>

      {message && (
        <p className="text-center text-sm text-red-600 mb-4">{message}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar area like Facebook */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <div
              className="w-28 h-28 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm flex items-center justify-center bg-gray-100"
              style={{ cursor: "pointer" }}
              onClick={triggerFileSelect}
              title="Click để thay đổi ảnh đại diện"
            >
              <img
                src={form.avatar || DEFAULT_AVATAR}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>

            {/* overlay edit icon */}
            <button
              type="button"
              onClick={triggerFileSelect}
              className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-md border"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.414 2.586a2 2 0 010 2.828l-9.9 9.9a1 1 0 01-.464.263l-4 1a1 1 0 01-1.213-1.213l1-4a1 1 0 01.263-.464l9.9-9.9a2 2 0 012.828 0z" />
              </svg>
            </button>
          </div>

          <div className="flex-1">
            <div className="text-lg font-medium text-gray-800">{form.name || "Tên chưa có"}</div>
            <div className="text-sm text-gray-500">{form.email}</div>
            <div className="mt-2 flex gap-3">
              <Button type="button" onClick={triggerFileSelect} className="px-3 py-1.5">
                Thay ảnh đại diện
              </Button>
              <Button type="submit" disabled={loading} className="px-3 py-1.5">
                {loading ? "Đang cập nhật..." : "Lưu thay đổi"}
              </Button>
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />

        {/* Input Fields */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Tên"
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Số điện thoại"
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Địa chỉ"
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;
