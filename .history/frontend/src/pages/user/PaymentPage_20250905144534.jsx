// src/pages/user/PaymentPage.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/axios";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { product, variant, quantity } = location.state || {};

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  // Lấy thông tin profile mặc định
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/user/profile");
        setForm({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
        });
      } catch (err) {
        console.error("Fetch profile error:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/user/orders", {
        product,
        variant,
        quantity,
        shippingInfo: form,
      });
      alert("✅ Đặt hàng thành công!");
      navigate("/user/orders");
    } catch (err) {
      console.error("Order error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "❌ Lỗi đặt hàng");
    }
  };

  if (!product) return <p>Không có sản phẩm để thanh toán</p>;

  return (
    <div className="container mt-4">
      <h2>Thanh toán</h2>
      <form onSubmit={handleSubmit} className="mt-3">
        <div className="mb-3">
          <label>Tên</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="form-control"
          />
        </div>
        <div className="mb-3">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="form-control"
          />
        </div>
        <div className="mb-3">
          <label>Số điện thoại</label>
          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="form-control"
          />
        </div>
        <div className="mb-3">
          <label>Địa chỉ</label>
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            className="form-control"
          />
        </div>
        <button type="submit" className="btn btn-danger">
          Xác nhận đặt hàng
        </button>
      </form>
    </div>
  );
};

export default PaymentPage;
