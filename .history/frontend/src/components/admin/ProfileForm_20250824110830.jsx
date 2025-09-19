import { useEffect, useState, useRef } from "react";
import api from "../../services/axios";

const DEFAULT_AVATAR = "/default-avatar.png";
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
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxMB = 5;
      if (file.size > maxMB * 1024 * 1024) {
        setMessage(`Ảnh quá lớn — hãy chọn ảnh < ${maxMB}MB`);
        return;
      }

      setAvatarFile(file);
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
      if (avatarFile) URL.revokeObjectURL(form.avatar);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6 sm:p-8 mt-8">
      <h2 className="text-2xl font-semibold text-center mb-6">Quản lý Profile Admin</h2>

      {message && (
        <p className="text-center text-sm text-red-600 mb-6" role="status">
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar section */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <div
              className="profile-avatar-display"
              onClick={triggerFileSelect}
              title="Click để thay đổi ảnh đại diện"
            >
              <img
                src={form.avatar || DEFAULT_AVATAR}
                alt="avatar"
                className="profile-avatar-img"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white opacity-0 hover:opacity-100 transition-opacity"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M17.414 2.586a2 2 0 010 2.828l-9.9 9.9a1 1 0 01-.464.263l-4 1a1 1 0 01-1.213-1.213l1-4a1 1 0 01.263-.464l9.9-9.9a2 2 0 012.828 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="text-lg font-medium">{form.name || "Tên chưa có"}</div>
            <div className="text-sm text-gray-500">{form.email}</div>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={triggerFileSelect}
                className="secondary flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M4 3a2 2 0 00-2 2v9.5A1.5 1.5 0 003.5 16H16a2 2 0 002-2V5a2 2 0 00-2-2H4z" />
                </svg>
                Thay ảnh đại diện
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white ${
                  loading ? "bg-blue-400 cursor-wait" : "bg-[var(--primary)] hover:bg-[var(--primary-hover)]"
                } transition-colors`}
              >
                {loading && (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.2" />
                    <path
                      d="M22 12a10 10 0 00-10-10"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
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

        {/* Form fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Tên
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Nhập tên"
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Nhập email"
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại
            </label>
            <input
              id="phone"
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Nhập số điện thoại"
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Địa chỉ
            </label>
            <input
              id="address"
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Nhập địa chỉ"
              className="w-full"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;