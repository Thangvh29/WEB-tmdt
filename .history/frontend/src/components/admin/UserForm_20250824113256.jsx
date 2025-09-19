// src/components/admin/UserForm.jsx
import { useState } from "react";

const UserForm = ({ user, onSubmit, onClose, submitting = false }) => {
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    role: user?.role || "user",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="bg-white p-4 rounded card-sm">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">{user ? "Cập nhật người dùng" : "Thêm người dùng"}</h5>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={onClose}
          aria-label="Đóng form"
        >
          Đóng
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="row g-2">
          <div className="col-12 col-md-6">
            <label htmlFor="name" className="form-label">Tên</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Tên"
              value={form.name}
              onChange={handleChange}
              className="form-control"
              autoComplete="name"
              required
            />
          </div>

          <div className="col-12 col-md-6">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="form-control"
              autoComplete="email"
              required
            />
          </div>

          <div className="col-12 col-md-6">
            <label htmlFor="phone" className="form-label">Số điện thoại</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="SĐT"
              value={form.phone}
              onChange={handleChange}
              className="form-control"
              autoComplete="tel"
            />
          </div>

          <div className="col-12 col-md-6">
            <label htmlFor="address" className="form-label">Địa chỉ</label>
            <input
              id="address"
              name="address"
              type="text"
              placeholder="Địa chỉ"
              value={form.address}
              onChange={handleChange}
              className="form-control"
              autoComplete="street-address"
            />
          </div>

          <div className="col-12 col-md-6">
            <label htmlFor="role" className="form-label">Vai trò</label>
            <select
              id="role"
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

        {/* Buttons: stack on xs, row on sm+ */}
        <div className="d-flex flex-column flex-sm-row gap-2 justify-content-end mt-3">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Hủy
          </button>

          <button
            type="submit"
            className="btn btn-primary d-flex align-items-center"
            disabled={submitting}
            aria-disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Đang xử lý...
              </>
            ) : (
              user ? "Cập nhật" : "Thêm"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
