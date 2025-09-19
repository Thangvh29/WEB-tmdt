import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/axios";
import Reviews from "../../components/user/Reviews";
import "../../assets/style/product-detail.css";

const ProductDetailPage = () => {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [attributes, setAttributes] = useState({});
  const [mainImage, setMainImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // =====================
  // Fetch product + profile
  // =====================
  useEffect(() => {
    fetchProduct();
    fetchProfile();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/user/products/${id}`);
      setProduct(data.product);

      if (data.product.images?.length > 0) {
        setMainImage(data.product.images[0]);
      }
      if (data.product.variants?.length > 0) {
        const def = data.product.variants.find((v) => v.isDefault);
        setSelectedVariant(def || data.product.variants[0]);
      }
    } catch (err) {
      setError("Không tìm thấy sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data } = await api.get("/user/profile");
      setProfile({
        name: data.user?.name || "",
        email: data.user?.email || "",
        phone: data.user?.phone || "",
        address: data.user?.address || "",
      });
    } catch (err) {
      console.error("Lỗi tải profile:", err);
    }
  };

  // =====================
  // Biến thể
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
      alert(err.response?.data?.message || "❌ Lỗi thêm vào giỏ hàng");
    }
  };

  // =====================
  // Mua ngay (mở form)
  // =====================
  const handleBuyNow = () => {
    if (!selectedVariant?._id || !selectedVariant?.stock) return;
    setShowPaymentForm(true);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/user/cart/checkout", {
        product: id,
        variant: selectedVariant._id,
        quantity: 1,
        shippingAddress: profile.address,
        phone: profile.phone,
        email: profile.email,
        name: profile.name,
      });
      alert("✅ Đặt hàng thành công!");
      setShowPaymentForm(false);
    } catch (err) {
      alert(err.response?.data?.message || "❌ Lỗi thanh toán");
    } finally {
      setSubmitting(false);
    }
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
        {/* Gallery ảnh */}
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

        {/* Thông tin */}
        <div className="product-info">
          <h1 className="product-title">{product.name}</h1>
          <div className="price">{priceDisplay} ₫</div>
          <div className="status">
            {inStock ? (
              <span className="text-success">Còn hàng</span>
            ) : (
              <span className="text-danger">Hết hàng</span>
            )}
          </div>

          {/* Biến thể */}
          {product.variants?.length > 0 && (
            <div className="variants">
              {[...new Set(
                product.variants.flatMap((v) =>
                  v.attributes.map((a) => a.name)
                )
              )].map((name) => (
                <div key={name} className="variant-select">
                  <label>{name}:</label>
                  <select
                    value={attributes[name] || ""}
                    onChange={(e) => handleAttributeChange(name, e.target.value)}
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
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="actions mt-3">
            {inStock ? (
              <>
                <button className="btn btn-danger me-2" onClick={handleBuyNow}>
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

      {/* Mô tả */}
      <div className="product-description mt-4">
        <h2>Mô tả sản phẩm</h2>
        <p>{product.description || "Chưa có mô tả"}</p>
      </div>

      {/* Reviews */}
      <div className="product-reviews mt-4">
        <Reviews productId={id} />
      </div>

      {/* Payment Modal */}
      {showPaymentForm && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSubmitPayment}>
                <div className="modal-header">
                  <h5 className="modal-title">Thanh toán</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowPaymentForm(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Họ và tên</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Số điện thoại</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Địa chỉ</label>
                    <textarea
                      className="form-control"
                      value={profile.address}
                      onChange={(e) =>
                        setProfile({ ...profile, address: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowPaymentForm(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger"
                    disabled={submitting}
                  >
                    {submitting ? "Đang xử lý..." : "Xác nhận mua"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
