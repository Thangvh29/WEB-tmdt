import { useState, useEffect } from "react";
import api from "../../"; // import đúng path
import { Button } from "../ui/button";

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
      try {
        const { data } = await api.get("/admin/profile/me"); // token tự động gửi
        setForm({
          name: data.profile.name,
          email: data.profile.email,
          phone: data.profile.phone || "",
          address: data.profile.address || "",
          avatar: data.profile.avatar || "",
        });
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

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("email", form.email);
    formData.append("phone", form.phone);
    formData.append("address", form.address);
    if (avatarFile) formData.append("avatar", avatarFile);

    try {
      const { data } = await api.put("/admin/profile/me", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(data.message || "Cập nhật thành công");
      setAvatarFile(null);
    } catch (err) {
      console.error(err);
      setMessage(err?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4">Quản lý profile admin</h2>
      {message && <p className="mb-2 text-red-600">{message}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col items-center">
          <img
            src={form.avatar || "/default-avatar.png"}
            alt="avatar"
            className="w-24 h-24 rounded-full mb-2 object-cover"
          />
          <input type="file" accept="image/*" onChange={handleAvatarChange} />
        </div>

        <input type="text" name="name" placeholder="Tên" value={form.name} onChange={handleChange} className="border p-2 rounded w-full" />
        <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} className="border p-2 rounded w-full" />
        <input type="text" name="phone" placeholder="Số điện thoại" value={form.phone} onChange={handleChange} className="border p-2 rounded w-full" />
        <input type="text" name="address" placeholder="Địa chỉ" value={form.address} onChange={handleChange} className="border p-2 rounded w-full" />

        <Button type="submit" disabled={loading}>{loading ? "Đang cập nhật..." : "Cập nhật profile"}</Button>
      </form>
    </div>
  );
};

export default ProfileForm;
