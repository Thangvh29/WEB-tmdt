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
    <div className="bg-white p-4 rounded shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">{user ? "Cập nhật người dùng" : "Thêm người dùng"}</h5>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>
          Đóng
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(form);
        }}
      >
        <div className="row g-2">
          <div className="col-12 col-md-6">
            <label className="form-label">Tên</label>
            <input
              type="text"
              name="name"
              placeholder="Tên"
              value={form.name}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label">Số điện thoại</label>
            <input
              type="text"
              name="phone"
              placeholder="SĐT"
              value={form.phone}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label">Địa chỉ</label>
            <input
              type="text"
              name="address"
              placeholder="Địa chỉ"
              value={form.address}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label">Vai trò</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="form-select"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="d-flex justify-content-end gap-2 mt-3">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className="btn btn-primary">
            {user ? "Cập nhật" : "Thêm"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
