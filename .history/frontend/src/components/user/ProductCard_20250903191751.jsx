// src/components/user/ProductCard.jsx
import React from "react";
import { backendURL } from "../../services/axios";

const ProductCard = ({ product, onViewDetail }) => {
  // Nếu có ảnh thì nối với backendURL, nếu không thì dùng ảnh mặc định
  const imageUrl = product.images?.length
    ? `${backendURL}${product.images[0]}`
    : "/no-image.png";

  return (
    <div className="post-card">
      {/* Header tác giả */}
      <div className="post-card-header">
        <div className="author-section">
          <img
            src={product.user?.avatar ? `${backendURL}${product.user.avatar}` : "/default-avatar.png"}
            alt={product.user?.name || "User"}
            className="avatar"
          />
          <div className="author-info">
            <span className="name">{product.user?.name}</span>
            <span className="time">
              {new Date(product.createdAt).toLocaleDateString("vi-VN")}
            </span>
          </div>
        </div>
      </div>

      {/* Nội dung sản phẩm */}
      <div className="post-content">
        <h6 className="card-title">{product.name}</h6>
        <p className="card-text">{product.description}</p>
      </div>

      {/* Ảnh sản phẩm */}
      <div className="post-images single">
        <img src={imageUrl} alt={product.name} />
      </div>

      {/* Giá và tồn kho */}
      <div className="post-stats">
        <span className="fw-bold">
          {Number(product.price || 0).toLocaleString()} ₫
        </span>
        <span className={product.stock > 0 ? "text-success" : "text-secondary"}>
          {product.stock > 0 ? `Còn ${product.stock}` : "Hết hàng"}
        </span>
      </div>

      {/* Nút chi tiết */}
      <div className="post-actions">
        <button onClick={() => onViewDetail(product._id)}>Chi tiết</button>
      </div>
    </div>
  );
};

export default ProductCard;
