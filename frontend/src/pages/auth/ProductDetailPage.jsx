import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/axios";
import Reviews from "../../components/auth/Reviews"; // dùng component giống user
import "../../assets/style/product-detail.css";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [attributes, setAttributes] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/products/${id}`); // public API
      setProduct(data.product);

      if (data.product.images?.length > 0) setMainImage(data.product.images[0]);
      if (data.product.variants?.length > 0) {
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

  const handleAttributeChange = (name, value) => {
    const newAttrs = { ...attributes, [name]: value };
    setAttributes(newAttrs);

    if (!product.variants) return;
    const match = product.variants.find((v) =>
      v.attributes.every(
        (a) => newAttrs[a.name] === a.value
      )
    );
    setSelectedVariant(match || null);
  };

  const handleRedirectLogin = () => navigate("/login");

  if (loading) return <p>Đang tải...</p>;
  if (error) return <p>{error}</p>;
  if (!product) return null;

  const inStock = selectedVariant ? selectedVariant.stock > 0 : product.stock > 0;
  const priceDisplay = selectedVariant?.price?.toLocaleString("vi-VN") || product.price?.toLocaleString("vi-VN");

  return (
    <div className="product-detail-page container my-4">
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

        {/* Thông tin sản phẩm */}
        <div className="product-info">
          <h1 className="product-title">{product.name}</h1>
          <div className="meta">
            <span>Đã bán: {product.sold ?? 0}</span> •
            <span>Đánh giá: {product.avgRating?.toFixed(1) || 0}/5</span>
          </div>
          <div className="price">{priceDisplay} ₫</div>
          <div className="status">
            Trạng thái: {inStock ? <span className="text-success">Còn hàng</span> : <span className="text-danger">Hết hàng</span>}
          </div>

          {/* Biến thể */}
          {product.variants?.length > 0 && (
            <div className="variants mt-3">
              {[...new Set(product.variants.flatMap(v => v.attributes.map(a => a.name)))].map(name => {
                const values = [...new Set(product.variants.flatMap(v => v.attributes.filter(a => a.name === name).map(a => a.value)))];
                return (
                  <div key={name} className="variant-select mb-3">
                    <label className="fw-bold d-block mb-1">{name}:</label>
                    <div className="variant-options d-flex flex-wrap gap-2">
                      {values.map(value => (
                        <button
                          key={value}
                          type="button"
                          className={`variant-option ${attributes[name] === value ? "active" : ""}`}
                          onClick={() => handleAttributeChange(name, value)}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="actions mt-3">
            <button className="btn btn-danger me-2" onClick={handleRedirectLogin} disabled={!inStock}>
              Mua ngay / Trả góp
            </button>
            <button className="btn btn-outline-primary" onClick={handleRedirectLogin}>
              Thêm vào giỏ hàng
            </button>
          </div>
        </div>
      </div>

      {/* Mô tả sản phẩm */}
      <div className="product-description mt-4">
        <h2>Mô tả sản phẩm</h2>
        <p>{product.description || "Chưa có mô tả"}</p>
      </div>

      {/* Thông số kỹ thuật */}
      {product.specs?.length > 0 && (
        <div className="product-specs mt-4">
          <h2>Thông số kỹ thuật</h2>
          <table className="table table-bordered">
            <tbody>
              {product.specs.map((spec, idx) => (
                <tr key={idx}>
                  <td><strong>{spec.name || spec.key || `Thông số ${idx + 1}`}</strong></td>
                  <td>{spec.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cam kết */}
      {product.commitments?.length > 0 && (
        <div className="product-commitments mt-4">
          <h2>Cam kết</h2>
          <ul>
            {product.commitments.map((cmt, idx) => <li key={idx}>{cmt}</li>)}
          </ul>
        </div>
      )}

      {/* Reviews */}
      <div className="product-reviews mt-4">
        <Reviews productId={id} />
      </div>
    </div>
  );
};

export default ProductDetailPage;
