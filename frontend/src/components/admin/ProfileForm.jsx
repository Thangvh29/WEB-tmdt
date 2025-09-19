// src/components/profile/ProfileForm.jsx
import { useEffect, useState, useRef } from "react";
import api from "../../services/axios";
import "../../assets/style/admin-profile.css";

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

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

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
      let avatarUrlFromServer = null;

      // ✅ Upload avatar riêng nếu có chọn file
      if (avatarFile) {
        const fd = new FormData();
        fd.append("avatar", avatarFile);

        const res = await api.post("/admin/profile/avatar", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        avatarUrlFromServer = res.data?.profile?.avatar ?? null;
        if (avatarUrlFromServer) {
          setForm((prev) => ({ ...prev, avatar: avatarUrlFromServer }));
        }

        setAvatarFile(null);
        if (avatarPreview) {
          URL.revokeObjectURL(avatarPreview);
          setAvatarPreview("");
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
      }

      // ✅ Update profile text
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
      };

      const updatedRes = await api.put("/admin/profile/me", payload);
      const updated = updatedRes.data?.profile ?? updatedRes.data;

      setForm({
        name: updated?.name || form.name,
        email: updated?.email || form.email,
        phone: updated?.phone || form.phone,
        address: updated?.address || form.address,
        avatar: updated?.avatar || avatarUrlFromServer || form.avatar,
      });

      setMessage(updatedRes.data?.message || "✅ Cập nhật thành công");
    } catch (err) {
      console.error("Cập nhật profile thất bại:", err);
      setMessage(err?.response?.data?.message || "❌ Cập nhật thất bại");
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
            style={{
              textAlign: "center",
              color: message.includes("thành công") ? "green" : "#dc2626",
              marginBottom: 12,
            }}
          >
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
                >
                  Thay ảnh đại diện
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn"
                  style={{ background: loading ? "#60a5fa" : undefined }}
                >
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
            style={{ display: "none" }}
          />

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
