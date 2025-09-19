// src/components/admin/products/ProductDetail.jsx
import React, { useState, useEffect } from "react";
import api from "../../../services/axios";
import ProductForm from "./ProductForm";

/**
 * Modal checkout form
 */
const CheckoutFormModal = ({ product, onClose, user }) => {
  const [form, setForm] = useState({
    shippingAddress: user?.address || "",
    phone: user?.phone || "",
    email: user?.email || "",
    note: "",
    paymentMethod: "cod",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/user/cart/checkout", {
        ...form,
        shippingFee: 0,
        discount: 0,
      });
      alert("Đặt hàng thành công!");
      onClose();
    } catch (err) {
      console.error("Checkout lỗi:", err);
      alert(err.response?.data?.message || "Có lỗi xảy ra khi đặt hàng");
    }
  };

  return (
    <div className="modal show d-block">
      <div className="modal-dialog">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">Thanh toán ngay</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <input
                name="shippingAddress"
                className="form-control mb-2"
                placeholder="Địa chỉ"
                value={form.shippingAddress}
                onChange={handleChange}
              />
              <input
                name="phone"
                className="form-control mb-2"
                placeholder="Số điện thoại"
                value={form.phone}
                onChange={handleChange}
              />
              <input
                name="email"
                type="email"
                className="form-control mb-2"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
              />
              <textarea
                name="note"
                className="form-control mb-2"
                placeholder="Ghi chú"
                value={form.note}
                onChange={handleChange}
              />
              <select
                name="paymentMethod"
                className="form-select"
                value={form.paymentMethod}
                onChange={handleChange}
              >
                <option value="cod">Thanh toán khi nhận</option>
                <option value="momo">Momo</option>
                <option value="paypal">Paypal</option>
                <option value="vnpay">VNPay</option>
              </select>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Đóng
              </button>
              <button type="submit" className="btn btn-success">
                Xác nhận mua
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/**
 * ProductDetail component
 */
const ProductDetail = ({ productId, onClose }) => {
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [editing, setEditing] = useState(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    fetchProfile();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/admin/products/${productId}`);
      setProduct(data);
    } catch {
      console.error("Lỗi tải sản phẩm");
    }
  };

  const fetchReviews = async () => {
    try {
      const { data } = await api.get(`/admin/reviews?productId=${productId}`);
      setReviews(data.reviews);
    } catch {
      console.error("Lỗi tải đánh giá");
    }
  };

  const fetchProfile = async () => {
    try {
      const { data } = await api.get("/user/profile/me");
      setUser(data);
    } catch {
      console.error("Không tải được profile user");
    }
  };

  const handleApproveReview = async (reviewId) => {
    await api.patch(`/admin/reviews/${reviewId}`, { approved: true });
    fetchReviews();
  };

  const handleDeleteReview = async (reviewId) => {
    await api.delete(`/admin/reviews/${reviewId}`);
    fetchReviews();
  };

  const handleReplyReview = async (reviewId, reply) => {
    if (!reply.trim()) return;
    await api.post(`/admin/reviews/${reviewId}/reply`, { reply });
    fetchReviews();
  };

  const handleAddToCart = async () => {
    try {
      await api.post("/user/cart", {
        product: productId,
        quantity: 1,
      });
      alert("Đã thêm sản phẩm vào giỏ hàng!");
    } catch (err) {
      console.error("Add to cart error:", err);
      alert(err.response?.data?.message || "Lỗi thêm vào giỏ hàng");
    }
  };

  if (!product) return <div>Loading...</div>;

  if (editing) {
    return (
      <div className="modal show d-block" tabIndex="-1">
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Chỉnh sửa sản phẩm</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setEditing(false)}
              />
            </div>
            <div className="modal-body">
              <ProductForm
                productId={productId}
                onSubmitSuccess={() => {
                  setEditing(false);
                  fetchProduct();
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="modal show d-block" tabIndex="-1">
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header bg-light">
              <h5 className="modal-title">{product.name}</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              {/* --- Thông tin sản phẩm --- */}
              <h6 className="mb-2">📌 Thông tin cơ bản</h6>
              <div className="row mb-3">
                <div className="col-md-6"><strong>Hãng:</strong> {product.brand}</div>
                <div className="col-md-6"><strong>Loại:</strong> {product.type}</div>
                <div className="col-md-6"><strong>Danh mục:</strong> {product.category?.name}</div>
                <div className="col-md-6"><strong>Giá cơ bản:</strong> {product.price?.toLocaleString()} ₫</div>
                <div className="col-md-6"><strong>Tình trạng:</strong> {product.isNewProduct ? "Mới" : "Cũ"}</div>
                <div className="col-md-6"><strong>Tồn kho tổng:</strong> {product.stock}</div>
              </div>

              {/* Ảnh sản phẩm */}
              <h6 className="mb-2">🖼 Ảnh sản phẩm</h6>
              <div className="row mb-3">
                {product.images.map((img, i) => (
                  <div key={i} className="col-md-3 mb-2">
                    <img src={img} alt="" className="img-fluid rounded border" />
                  </div>
                ))}
              </div>

              {/* Reviews */}
              <h6 className="mb-2">⭐ Đánh giá khách hàng</h6>
              {reviews.length === 0 && <p>Chưa có đánh giá nào.</p>}
              {reviews.map((review) => (
                <div key={review._id} className="border rounded p-2 mb-2">
                  <p className="mb-1">
                    <strong>{review.user?.name}:</strong> {review.content}
                  </p>
                  <small className="text-muted">⭐ {review.rating} / 5</small>
                  <div className="d-flex gap-2 mt-2">
                    {!review.approved && (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleApproveReview(review._id)}
                      >
                        Duyệt
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteReview(review._id)}
                    >
                      Xóa
                    </button>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Trả lời..."
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        handleReplyReview(review._id, e.target.value)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>
                Đóng
              </button>
              <button className="btn btn-primary" onClick={() => setEditing(true)}>
                Chỉnh sửa
              </button>
              <button className="btn btn-outline-primary" onClick={handleAddToCart}>
                🛒 Thêm vào giỏ hàng
              </button>
              <button
                className="btn btn-success"
                onClick={() => setShowCheckoutForm(true)}
              >
                💳 Mua ngay
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal checkout */}
      {showCheckoutForm && (
        <CheckoutFormModal
          product={product}
          user={user}
          onClose={() => setShowCheckoutForm(false)}
        />
      )}
    </>
  );
};

export default ProductDetail;
