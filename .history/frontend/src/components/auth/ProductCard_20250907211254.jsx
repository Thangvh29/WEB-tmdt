// frontend/src/components/auth/ProductCard.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../assets/style/product-card.css";

const ProductCard = ({ product }) => {
  const inStock = product.stock > 0;
  const navigate = useNavigate();

  const handleBuyNow = () => navigate("/login");
  const handleAddToCart = () => navigate("/login");

  return (
    <div className="card product-card shadow-sm text-dark">
      {/* Ảnh sản phẩm */}
      <img
        src={product.image || "/no-image.png"}
        className="card-img-top"
        alt={product.name}
      />

      {/* Nội dung card */}
      <div className="card-body d-flex flex-column">
        <h6 className="card-title multiline-title" title={product.name}>
          {product.name}
        </h6>

        <p className="card-text small text-muted mb-1">
          {product.brand} - {product.type}
        </p>

        <p className="fw-bold text-danger mb-1">
          {product.priceRange?.min === product.priceRange?.max
            ? product.priceRange?.min.toLocaleString("vi-VN") + " ₫"
            : `${product.priceRange?.min.toLocaleString("vi-VN")} - ${product.priceRange?.max.toLocaleString("vi-VN")} ₫`}
        </p>

        <span
          className={`badge ${inStock ? "bg-success" : "bg-secondary"} mb-2`}
        >
          {inStock ? `Còn ${product.stock}` : "Hết hàng"}
        </span>

        <p className="text-muted small mb-2">Đã bán: {product.sold ?? 0}</p>

        {/* Public actions */}
        <button
          onClick={handleBuyNow}
          className="btn btn-danger btn-sm mb-1"
          disabled={!inStock}
        >
          Mua ngay
        </button>
        <button onClick={handleAddToCart} className="btn btn-outline-primary btn-sm">
          Thêm vào giỏ hàng
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
