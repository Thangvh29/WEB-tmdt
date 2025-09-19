// frontend/src/pages/auth/ProductDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/axios";
import Reviews from "../../components/auth/Reviews";
import "../../assets/style/product-detail.css";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      // Gọi public API
      const { data } = await api.get(`/products/${id}`);
      setProduct(data.product);
      if (data.product.images?.length > 0) setMainImage(data.product.images[0]);
    } catch (err) {
      setError("Không tìm thấy sản phẩm");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRedirectLogin = () => navigate("/login");

  if (loading) return <p>Đang tải...</p>;
  if (error) return <p>{error}</p>;
  if (!product) return null;

  const inStock = product.stock > 0;
  const priceDisplay = product.price?.toLocaleString("vi-VN");

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
            Trạng thái:{" "}
            {inStock ? <span className="text-success">Còn hàng</span> : <span className="text-danger">Hết hàng</span>}
          </div>

          {/* Actions public */}
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

      {/* Reviews */}
      <div className="product-reviews mt-4">
        <Reviews productId={id} />
      </div>
    </div>
  );
};

export default ProductDetailPage;
