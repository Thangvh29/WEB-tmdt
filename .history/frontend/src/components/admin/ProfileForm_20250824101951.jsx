import useAdminProfile from "../../hooks/useAdminProfile";
import { Button } from "../ui/button";

const ProfileForm = () => {
  const {
    profile,
    loading,
    message,
    handleChange,
    handleAvatarChange,
    updateProfile,
  } = useAdminProfile();

  // Bỏ type annotation vì đây là JSX
  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateProfile();
  };

  return (
    <div className="max-w-lg mx-auto bg-white shadow-lg rounded-lg p-6 mt-8">
      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
        Quản lý Profile Admin
      </h2>

      {message && (
        <p className="text-center text-red-500 mb-4">{message}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="w-28 h-28 mb-3">
            <img
              src={profile.avatar || "/default-avatar.png"}
              alt="avatar"
              className="w-full h-full rounded-full object-cover border-2 border-gray-300"
            />
          </div>
          <input
            type="file"
            onChange={handleAvatarChange}
            className="text-sm text-gray-600"
          />
        </div>

        {/* Fields */}
        <input
          type="text"
          name="name"
          value={profile.name}
          onChange={handleChange}
          placeholder="Tên"
          className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="email"
          name="email"
          value={profile.email}
          onChange={handleChange}
          placeholder="Email"
          className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          name="phone"
          value={profile.phone}
          onChange={handleChange}
          placeholder="Số điện thoại"
          className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          name="address"
          value={profile.address}
          onChange={handleChange}
          placeholder="Địa chỉ"
          className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded"
        >
          {loading ? "Đang cập nhật..." : "Cập nhật profile"}
        </Button>
      </form>
    </div>
  );
};

export default ProfileForm;
