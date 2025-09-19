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
  const [canBuy, setCanBuy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mainImage, setMainImage] = useState("");

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/user/products/${id}`);
      setProduct(data.product);
      setCanBuy(data.product.canBuy);

      // Ảnh chính
      if (data.product.images?.length > 0) {
        setMainImage(data.product.images[0]);
      }

      // Biến thể mặc định
      if (data.product?.variants?.length > 0) {
        const def = data.product.variants.find((v) => v.isDefault);
        setSelectedVariant(def || data.product.variants[0]);
      }
    } catch (err) {
      setError("Không tìm thấy sản phẩm");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleAddToCart = async () => {
    if (!selectedVariant?._id || !selectedVariant?.stock) return;
    try {
      await api.post("/user/cart", {
        productId: id,
        variantId: selectedVariant._id,
        quantity: 1,
      });
      alert("Đã thêm vào giỏ hàng");
    } catch (err) {
      console.error(err);
    }
  };

  const handleBuyNow = () => {
    if (!selectedVariant?._id || !selectedVariant?.stock) return;
    navigate("/user/payment", {
      state: { productId: id, variantId: selectedVariant._id },
    });
  };

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

                  {/* Nếu là màu sắc thì hiển thị dạng nút */}
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
                <button className="btn btn-danger" onClick={handleBuyNow}>
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
                  <strong>{spec.name || spec.key || `Thông số ${idx + 1}`}</strong>
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
    </div>
  );
};

export default ProductDetailPage;
