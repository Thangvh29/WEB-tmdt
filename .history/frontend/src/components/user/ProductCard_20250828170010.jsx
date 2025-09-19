// frontend/src/components/user/ProductCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const inStock = product.stock > 0;

  return (
    <Link to={`/user/products/${product._id}`} className="product-card">
      <img src={product.images[0]} alt={product.name} />
      <h3>{product.name}</h3>
      <p>Giá từ: {product.priceRange.min} VND</p>
      {product.isNewProduct ? <span>Mới</span> : <span>Cũ</span>}
      {!inStock && <span className="out-of-stock">Hết hàng</span>}
    </Link>
  );
};

export default ProductCard;