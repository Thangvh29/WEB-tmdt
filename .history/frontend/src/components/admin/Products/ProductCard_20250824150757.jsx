// src/components/admin/products/ProductCard.jsx
import React from 'react';

const ProductCard = ({ product, onViewDetail, onDelete }) => {
  return (
    <div className="col-md-3 col-sm-6 mb-4">
      <div className="card h-100 shadow-sm">
        <img
          src={product.images?.[0] || "/default-product.png"}
          className="card-img-top"
          alt={product.name}
          style={{ objectFit: "cover", height: "180px" }}
        />
        <div className="card-body d-flex flex-column">
          <h5 className="card-title">{product.name}</h5>
          <p className="card-text small text-muted">
            {product.brand} - {product.type}
          </p>
          <p className="text-danger fw-bold">
            {product.price?.toLocaleString()} ₫
          </p>
          <p className="small">Tồn: {product.stock}</p>
          <div className="mt-auto d-flex justify-content-between">
            <button
              className="btn btn-sm btn-primary"
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
    </div>
  );
};

export default ProductCard;
