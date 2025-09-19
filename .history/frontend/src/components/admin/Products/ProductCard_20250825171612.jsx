// src/components/admin/Products/ProductCard.jsx
import React from 'react';

const ProductCard = ({ product, onViewDetail, onDelete }) => {
  return (
    <div className="card product-card shadow-sm">
      <img
        src={product.images?.[0] || "/no-image.png"}
        className="card-img-top"
        alt={product.name}
      />
      <div className="card-body d-flex flex-column">
        {/* Bỏ text-truncate, thêm title để vẫn có tooltip */}
        <h6 className="card-title multiline-title" title={product.name}>
          {product.name}
        </h6>

        <p className="card-text small text-muted mb-1">
          {product.brand} - {product.type}
        </p>
        <p className="fw-bold text-danger mb-1">
          {Number(product.price || 0).toLocaleString()} ₫
        </p>
        <span
          className={`badge ${product.stock > 0 ? "bg-success" : "bg-secondary"} mb-2`}
        >
          {product.stock > 0 ? `Còn ${product.stock}` : "Hết hàng"}
        </span>
        <div className="mt-auto d-flex justify-content-between">
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => onViewDetail(product._id)}
          >
            Chi tiết
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => onDelete(product._id)}
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
