// src/components/profile/ProfileForm.jsx
import { useEffect, useState, useRef } from "react";
import api from "../../services/axios";
import "../../assets/style/admin-profile.css";

const DEFAULT_AVATAR = "/default-avatar.png";
const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const ProfileForm = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    avatar: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);

  // cleanup preview URL tránh memory leak
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

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
          avatar: data.profile.avatar
            ? `${backendURL}${data.profile.avatar}`
            : "",
        }));
        setMessage("");
      } catch (err) {
        console.error("Không thể lấy profile admin:", err);
        setMessage("Không thể load profile. Vui lòng đăng nhập lại");
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const triggerFileSelect = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const maxMB = 5;
      if (file.size > maxMB * 1024 * 1024) {
        setMessage(`Ảnh quá lớn — hãy chọn ảnh < ${maxMB}MB`);
        return;
      }

      setAvatarFile(file);

      // cleanup preview cũ trước khi tạo mới
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);

      const preview = URL.createObjectURL(file);
      setAvatarPreview(preview);

      setForm((prev) => ({ ...prev, avatar: preview }));
      setMessage("");
    }
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
        avatar: data.profile.avatar
          ? `${backendURL}${data.profile.avatar}`
          : prev.avatar,
      }));

      setAvatarFile(null);
      setAvatarPreview("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessage(data.message || "Cập nhật thành công");
    } catch (err) {
      console.error("Cập nhật profile thất bại:", err);
      setMessage(err?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-profile-page">
      <div className="card max-w-3xl mx-auto p-6 mt-8">
        <h2 className="text-2xl font-semibold text-center mb-4">
          Quản lý Profile Admin
        </h2>

        {message && (
          <p
            className="hint"
            role="status"
            style={{ textAlign: "center", color: "#dc2626", marginBottom: 12 }}
          >
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar + actions */}
          <div className="profile-header">
            <div
              className="avatar avatar--lg"
              style={{ cursor: "pointer" }}
              onClick={triggerFileSelect}
            >
              <img src={form.avatar || DEFAULT_AVATAR} alt="avatar" />
            </div>

            <div className="profile-info">
              <div className="name">{form.name || "Tên chưa có"}</div>
              <div className="email">{form.email}</div>

              <div className="actions">
                <button
                  type="button"
                  onClick={triggerFileSelect}
                  className="btn"
                  aria-label="Thay ảnh đại diện"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="icon"
                    style={{ width: 16, height: 16 }}
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
                  className="btn"
                  style={{ background: loading ? "#60a5fa" : undefined }}
                >
                  {loading ? (
                    <svg
                      className="animate-spin"
                      style={{ width: 16, height: 16 }}
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        opacity="0.2"
                      />
                      <path
                        d="M22 12a10 10 0 00-10-10"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : null}
                  {loading ? "Đang cập nhật..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: "none" }}
          />

          {/* Inputs grid */}
          <div className="inputs-grid">
            <input
              className="form-control"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Tên"
            />
            <input
              className="form-control"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
            />
            <input
              className="form-control"
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Số điện thoại"
            />
            <input
              className="form-control"
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Địa chỉ"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileForm;
