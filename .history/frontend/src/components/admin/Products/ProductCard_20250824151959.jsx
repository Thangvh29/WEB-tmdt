import React from 'react';

const ProductCard = ({ product, onViewDetail, onDelete }) => {
  return (
    <div className="col-md-4 col-lg-3 mb-4">
      <div className="card h-100 shadow-sm">
        <img
          src={product.images[0]}
          className="card-img-top"
          alt={product.name}
          style={{ height: "180px", objectFit: "cover" }}
        />
        <div className="card-body d-flex flex-column">
          <h6 className="card-title text-truncate">{product.name}</h6>
          <p className="card-text small text-muted mb-1">
            {product.brand} - {product.type}
          </p>
          <p className="fw-bold text-danger mb-1">
            {product.price.toLocaleString()} ₫
          </p>
          <span className={`badge ${product.stock > 0 ? 'bg-success' : 'bg-secondary'} mb-2`}>
            {product.stock > 0 ? `Còn ${product.stock}` : 'Hết hàng'}
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
    </div>
  );
};

export default ProductCard;
