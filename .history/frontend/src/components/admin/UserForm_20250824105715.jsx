// src/components/admin/UserForm.jsx
import { useState } from "react";

const UserForm = ({ user, onSubmit, onClose }) => {
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    role: user?.role || "user",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-bold mb-4">
        {user ? "Cập nhật người dùng" : "Thêm người dùng"}
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(form);
        }}
        className="flex flex-col gap-3"
      >
        <input
          type="text"
          name="name"
          placeholder="Tên"
          value={form.name}
          onChange={handleChange}
          className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <input
          type="text"
          name="phone"
          placeholder="SĐT"
          value={form.phone}
          onChange={handleChange}
          className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <input
          type="text"
          name="address"
          placeholder="Địa chỉ"
          value={form.address}
          onChange={handleChange}
          className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>

        {/* Action buttons */}
        <div className="flex gap-2 justify-end mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            {user ? "Cập nhật" : "Thêm"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
