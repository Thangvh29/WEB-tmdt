import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/axios";
import Reviews from "../../components/user/Reviews";
import Payment from "../../components/user/Payment"; // form thanh toán
import "../../assets/style/product-detail.css";

const ProductDetailPage = () => {
  const { id } = useParams();

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

      if (data.product.images?.length > 0) {
        setMainImage(data.product.images[0]);
      }

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
  // Mua ngay (hiện Payment)
  // =====================
  const handleBuyNow = () => {
    if (!selectedVariant?._id || !selectedVariant?.stock) return;
    setShowPayment(true);
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

      {/* Payment hiển thị ngay trong trang */}
      {showPayment && (
        <Payment
          product={id}
          variant={selectedVariant._id}
          quantity={1}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  );
};

export default ProductDetailPage;
