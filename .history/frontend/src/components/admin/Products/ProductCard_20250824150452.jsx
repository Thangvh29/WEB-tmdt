// src/components/admin/products/ProductCard.jsx
import React from 'react';

const ProductCard = ({ product, onViewDetail, onDelete }) => {
  return (
    <div className="product-card">
      <img src={product.images[0]} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{product.brand} - {product.type}</p>
      <p>Giá: {product.price}</p>
      <p>Tồn: {product.stock}</p>
      <button onClick={() => onViewDetail(product._id)}>Chi tiết</button>
      <button onClick={() => onDelete(product._id)}>Xóa</button>
    </div>
  );
};

export default ProductCard;