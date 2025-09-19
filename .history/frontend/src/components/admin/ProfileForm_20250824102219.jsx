import { useEffect, useState } from "react";
import api from "../../services/axios";
import { Button } from "../../components/ui/button";

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
    if (e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
      setForm({ ...form, avatar: URL.createObjectURL(e.target.files[0]) });
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

      const { data } = await api.put("/admin/profile/me", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

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
    }
  };

  return (
    <div>
      <h2>Quản lý profile admin</h2>
      {message && <p style={{ color: "red" }}>{message}</p>}

      <form onSubmit={handleSubmit}>
        <img src={form.avatar || "/default-avatar.png"} alt="avatar" width={100} />
        <input type="file" onChange={handleAvatarChange} />

        <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Tên" />
        <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email" />
        <input type="text" name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" />
        <input type="text" name="address" value={form.address} onChange={handleChange} placeholder="Address" />

        <Button type="submit" disabled={loading}>
          {loading ? "Đang cập nhật..." : "Cập nhật profile"}
        </Button>
      </form>
    </div>
  );
};

export default ProfileForm;
