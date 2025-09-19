import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/axios";

const Payment = ({ product, variant, quantity, onClose }) => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);

  // ✅ Lấy thông tin profile mặc định
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/user/profile/me");
        setForm({
          name: data.user?.name || "",
          email: data.user?.email || "",
          phone: data.user?.phone || "",
          address: data.user?.address || "",
        });
      } catch (err) {
        console.error("Lỗi tải profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/user/cart/checkout", {
        product,
        variant,
        quantity,
        shippingAddress: form.address,
        phone: form.phone,
        email: form.email,
        name: form.name,
      });

      alert("✅ Đặt hàng thành công!");
      if (onClose) onClose();
      navigate("/user/orders");
    } catch (err) {
      console.error("Lỗi thanh toán:", err.response?.data || err.message);
      alert(err.response?.data?.message || "❌ Lỗi thanh toán");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-card">
      <h3 className="text-center mb-3">Thanh toán</h3>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Họ và tên</label>
          <input
            type="text"
            name="name"
            className="form-control"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            name="email"
            className="form-control"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Số điện thoại</label>
          <input
            type="tel"
            name="phone"
            className="form-control"
            value={form.phone}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Địa chỉ giao hàng</label>
          <textarea
            name="address"
            className="form-control"
            rows="3"
            value={form.address}
            onChange={handleChange}
            required
          />
        </div>

        <div className="d-flex justify-content-between">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Hủy
          </button>
          <button type="submit" className="btn btn-danger" disabled={loading}>
            {loading ? "Đang xử lý..." : "Xác nhận thanh toán"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Payment;
