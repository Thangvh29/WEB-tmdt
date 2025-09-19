// src/pages/user/ProductDetailPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/axios";
import Reviews from "../../components/user/Reviews";
import "../../assets/style/product-detail.css";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [attributes, setAttributes] = useState({});
  const [mainImage, setMainImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPayment, setShowPayment] = useState(false);

  // =====================
  // Fetch product detail
  // =====================
  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/user/products/${id}`);
      setProduct(data.product);

      // Ảnh chính mặc định
      if (data.product.images?.length > 0) {
        setMainImage(data.product.images[0]);
      }

      // Biến thể mặc định
      if (data.product.variants?.length > 0) {
        const def = data.product.variants.find((v) => v.isDefault);
        setSelectedVariant(def || data.product.variants[0]);
      }
    } catch (err) {
      setError("Không tìm thấy sản phẩm");
      console.error("Fetch product error:", err);
    } finally {
      setLoading(false);
    }
  };

  // =====================
  // Chọn biến thể
  // =====================
  const handleAttributeChange = async (name, value) => {
    const newAttrs = { ...attributes, [name]: value };
    setAttributes(newAttrs);

    try {
      const { data } = await api.post(`/user/products/${id}/check-variant`, {
        attributes: newAttrs,
      });
      setSelectedVariant(data.found ? data.variant : null);
    } catch (err) {
      console.error("Error checking variant:", err);
    }
  };

  // =====================
  // Thêm vào giỏ hàng
  // =====================
  const handleAddToCart = async () => {
    if (!selectedVariant?._id || !selectedVariant?.stock) return;
    try {
      await api.post("/user/cart", {
        product: id,
        variant: selectedVariant._id,
        quantity: 1,
      });
      alert("✅ Đã thêm vào giỏ hàng");
    } catch (err) {
      console.error("Add to cart error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "❌ Lỗi thêm vào giỏ hàng");
    }
  };

  // =====================
  // Mua ngay
  // =====================
  const handleBuyNow = () => {
    if (!selectedVariant?._id || !selectedVariant?.stock) return;
    console.log(">>> mở Payment modal"); // test
    setShowPayment(true); // ✅ mở modal Payment
  };

  // =====================
  // UI Render
  // =====================
  if (loading) return <p>Đang tải...</p>;
  if (error) return <p>{error}</p>;
  if (!product) return null;

  const inStock = selectedVariant
    ? selectedVariant.stock > 0
    : product.stock > 0;

  const priceDisplay =
    selectedVariant?.price?.toLocaleString("vi-VN") ||
    product.price?.toLocaleString("vi-VN");

  return (
    <div className="product-detail-page container">
      <div className="product-detail-grid">
        {/* Cột trái: gallery ảnh */}
        <div className="product-images">
          <img src={mainImage} alt={product.name} className="main-image" />
          <div className="thumbnails">
            {product.images?.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`${product.name}-${idx}`}
                className={`thumb ${mainImage === img ? "active" : ""}`}
                onClick={() => setMainImage(img)}
              />
            ))}
          </div>
        </div>

        {/* Cột phải: thông tin sản phẩm */}
        <div className="product-info">
          <h1 className="product-title">{product.name}</h1>

          <div className="meta">
            <span>Đã bán: {product.sold ?? 0}</span>
            <span>•</span>
            <span>Đánh giá: {product.avgRating?.toFixed(1) || 0}/5</span>
          </div>

          <div className="price">{priceDisplay} ₫</div>

          <div className="status">
            Trạng thái:{" "}
            {inStock ? (
              <span className="text-success">Còn hàng</span>
            ) : (
              <span className="text-danger">Hết hàng</span>
            )}
          </div>

          {/* Biến thể */}
          {product.variants?.length > 0 ? (
            <div className="variants">
              {[...new Set(
                product.variants.flatMap((v) =>
                  v.attributes.map((a) => a.name)
                )
              )].map((name) => (
                <div key={name} className="variant-select">
                  <label>{name}:</label>

                  {["Màu sắc", "Color"].includes(name) ? (
                    <div className="variant-options">
                      {[...new Set(
                        product.variants
                          .flatMap((v) =>
                            v.attributes
                              .filter((a) => a.name === name)
                              .map((a) => a.value)
                          )
                      )].map((value) => (
                        <button
                          key={value}
                          type="button"
                          className={`variant-btn ${
                            attributes[name] === value ? "active" : ""
                          }`}
                          onClick={() => handleAttributeChange(name, value)}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <select
                      value={attributes[name] || ""}
                      onChange={(e) =>
                        handleAttributeChange(name, e.target.value)
                      }
                    >
                      <option value="">Chọn</option>
                      {[...new Set(
                        product.variants
                          .flatMap((v) =>
                            v.attributes
                              .filter((a) => a.name === name)
                              .map((a) => a.value)
                          )
                      )].map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="no-variants">Sản phẩm không có biến thể</p>
          )}

          {/* Actions */}
          <div className="actions">
            {inStock ? (
              <>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleBuyNow}
                >
                  Mua ngay / Trả góp
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={handleAddToCart}
                >
                  Thêm vào giỏ hàng
                </button>
              </>
            ) : (
              <button className="btn btn-secondary" disabled>
                Hết hàng
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mô tả sản phẩm */}
      <div className="product-description">
        <h2>Mô tả sản phẩm</h2>
        <p>{product.description || "Chưa có mô tả"}</p>
      </div>

      {/* Thông số kỹ thuật */}
      {product.specs?.length > 0 && (
        <div className="product-specs">
          <h2>Thông số kỹ thuật</h2>
          <table className="table table-bordered">
            <tbody>
              {product.specs.map((spec, idx) => (
                <tr key={idx}>
                  <td>
                    <strong>
                      {spec.name || spec.key || `Thông số ${idx + 1}`}
                    </strong>
                  </td>
                  <td>{spec.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cam kết */}
      {product.commitments?.length > 0 && (
        <div className="product-commitments">
          <h2>Cam kết</h2>
          <ul>
            {product.commitments.map((cmt, idx) => (
              <li key={idx}>{cmt}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Reviews */}
      <div className="product-reviews">
        <Reviews productId={id} />
      </div>

      {/* Payment modal */}
      {showPayment && (
        <Payment
          product={id}
          variant={selectedVariant._id}
          quantity={1}
          onClose={() => setShowPayment(false)}
          navigate={navigate}
        />
      )}
    </div>
  );
};

export default ProductDetailPage;

// ==============================
// Component Payment tích hợp luôn
// ==============================
const Payment = ({ product, variant, quantity, onClose, navigate }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);

  // Lấy profile mặc định
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
    <div className="payment-overlay">
      <div className="payment-modal">
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
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-danger" disabled={loading}>
              {loading ? "Đang xử lý..." : "Xác nhận thanh toán"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
