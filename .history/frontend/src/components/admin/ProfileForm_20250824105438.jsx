// src/components/profile/ProfileForm.jsx
import { useEffect, useState, useRef } from "react";
import api from "../../services/axios";

const DEFAULT_AVATAR = "/default-avatar.png";

/**
 * ProfileForm (self-contained)
 * - Không dùng ../ui/button
 * - Upload avatar bằng FormData (axios instance 'api' sẽ tự set Authorization + headers)
 * - Preview avatar khi chọn file
 * - Buttons styled inline (Tailwind-like classes). Nếu bạn không dùng Tailwind,
 *   các class vẫn tương đối chuẩn và file index.css trước đó đảm bảo override.
 */
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
        setForm((prev) => ({
          ...prev,
          name: data.profile.name || "",
          email: data.profile.email || "",
          phone: data.profile.phone || "",
          address: data.profile.address || "",
          avatar: data.profile.avatar || "",
        }));
        setMessage("");
      } catch (err) {
        console.error("Không thể lấy profile admin:", err);
        setMessage("Không thể load profile. Vui lòng đăng nhập lại");
      }
    };

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // optional: quick client-side validation
      const maxMB = 5;
      if (file.size > maxMB * 1024 * 1024) {
        setMessage(`Ảnh quá lớn — hãy chọn ảnh < ${maxMB}MB`);
        return;
      }

      setAvatarFile(file);
      // preview
      setForm((prev) => ({ ...prev, avatar: URL.createObjectURL(file) }));
      setMessage("");
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

      // IMPORTANT: don't set Content-Type manually
      const { data } = await api.put("/admin/profile/me", formData);

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
      if (avatarFile) URL.revokeObjectURL(avatarFile);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6 mt-8 sm:p-8">
      <h2 className="text-2xl font-semibold text-center text-gray-800 mb-4">
        Quản lý Profile Admin
      </h2>

      {message && (
        <p className="text-center text-sm text-red-600 mb-4" role="status">
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar row */}
        <div className="flex items-center gap-6">
          <div className="profile-avatar-wrapper relative">
            <div
              className="profile-avatar-display"
              onClick={triggerFileSelect}
              title="Click để thay đổi ảnh đại diện"
              style={{ cursor: "pointer" }}
            >
              <img
                src={form.avatar || DEFAULT_AVATAR}
                alt="avatar"
                className="profile-avatar-img"
              />
            </div>

            {/* overlay edit icon (button-like) */}
            <button
              type="button"
              onClick={triggerFileSelect}
              aria-label="Thay ảnh đại diện"
              className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-md border"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.414 2.586a2 2 0 010 2.828l-9.9 9.9a1 1 0 01-.464.263l-4 1a1 1 0 01-1.213-1.213l1-4a1 1 0 01.263-.464l9.9-9.9a2 2 0 012.828 0z" />
              </svg>
            </button>
          </div>

          <div className="flex-1">
            <div className="text-lg font-medium text-gray-800">{form.name || "Tên chưa có"}</div>
            <div className="text-sm text-gray-500">{form.email}</div>

            <div className="mt-3 flex flex-wrap gap-3">
              {/* Secondary (muted) action */}
              <button
                type="button"
                onClick={triggerFileSelect}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white text-gray-700 border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 transition"
              >
                {/* icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 3a2 2 0 00-2 2v9.5A1.5 1.5 0 003.5 16H16a2 2 0 002-2V5a2 2 0 00-2-2H4z" />
                </svg>
                Thay ảnh đại diện
              </button>

              {/* Primary action */}
              <button
                type="submit"
                disabled={loading}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium transition ${
                  loading ? "bg-blue-400 cursor-wait" : "bg-[#1877f2] hover:bg-[#155dc1]"
                } text-white shadow-sm`}
              >
                {loading ? (
                  // spinner
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.2" />
                    <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                ) : null}
                {loading ? "Đang cập nhật..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>

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
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#1877f2]"
          />
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#1877f2]"
          />
          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Số điện thoại"
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#1877f2]"
          />
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Địa chỉ"
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#1877f2]"
          />
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;
