import useAdminProfile from "../../hooks/useAdminProfile";
import { Button } from "../../components/ui/button";

const ProfileForm = () => {
  const {
    profile,
    loading,
    message,
    handleChange,
    handleAvatarChange,
    updateProfile,
  } = useAdminProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile();
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-md rounded-md p-6 mt-8">
      <h2 className="text-2xl font-semibold mb-4 text-center">Quản lý Profile Admin</h2>

      {message && <p className="text-red-500 mb-4 text-center">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col items-center">
          <img
            src={profile.avatar || "/default-avatar.png"}
            alt="avatar"
            className="w-24 h-24 rounded-full object-cover mb-2 border"
          />
          <input type="file" onChange={handleAvatarChange} className="text-sm" />
        </div>

        <input
          type="text"
          name="name"
          value={profile.name}
          onChange={handleChange}
          placeholder="Tên"
          className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="email"
          name="email"
          value={profile.email}
          onChange={handleChange}
          placeholder="Email"
          className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          name="phone"
          value={profile.phone}
          onChange={handleChange}
          placeholder="Số điện thoại"
          className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          name="address"
          value={profile.address}
          onChange={handleChange}
          placeholder="Địa chỉ"
          className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Đang cập nhật..." : "Cập nhật profile"}
        </Button>
      </form>
    </div>
  );
};

export default ProfileForm;
