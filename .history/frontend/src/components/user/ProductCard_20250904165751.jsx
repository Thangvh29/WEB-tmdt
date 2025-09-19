import React from "react";
import { Link } from "react-router-dom";
import "../../assets/style/product-card.css"; // có thể dùng lại hoặc import bootstrap

const ProductCard = ({ product }) => {
  const inStock = product.stock > 0;

  return (
    <div className="card product-card shadow-sm">
      <Link to={`/user/products/${product._id}`}>
        <img
          src={product.image || "/no-image.png"}
          className="card-img-top"
          alt={product.name}
        />
      </Link>
      <div className="card-body d-flex flex-column">
        {/* Tên sản phẩm */}
        <h6 className="card-title multiline-title" title={product.name}>
          {product.name}
        </h6>

        {/* Brand + Type */}
        <p className="card-text small text-muted mb-1">
          {product.brand} - {product.type}
        </p>

        {/* Giá */}
        <p className="fw-bold text-danger mb-1">
          {product.priceRange?.min === product.priceRange?.max
            ? product.priceRange?.min.toLocaleString("vi-VN") + " ₫"
            : `${product.priceRange?.min.toLocaleString("vi-VN")} - ${product.priceRange?.max.toLocaleString("vi-VN")} ₫`}
        </p>

        {/* Badge tồn kho */}
        <span
          className={`badge ${
            inStock ? "bg-success" : "bg-secondary"
          } mb-2`}
        >
          {inStock ? `Còn ${product.stock}` : "Hết hàng"}
        </span>

        {/* Đã bán */}
        <p className="text-muted small mb-0">Đã bán: {product.sold ?? 0}</p>
      </div>
    </div>
  );
};

export default ProductCard;
