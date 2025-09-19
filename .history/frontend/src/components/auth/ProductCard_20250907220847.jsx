import React from "react";
import { Link } from "react-router-dom";
import "../../assets/style/product-card.css";

const ProductCard = ({ product }) => {
  const inStock = product.stock > 0;

  return (
    <Link
      to={`/products/${product._id}`} // public detail route
      className="card product-card shadow-sm text-dark text-decoration-none"
    >
      <img
        src={product.image || "/no-image.png"}
        className="card-img-top"
        alt={product.name}
      />
      <div className="card-body d-flex flex-column">
        <h6 className="card-title multiline-title" title={product.name}>
          {product.name}
        </h6>
        <p className="fw-bold text-danger mb-1">
          {product.price?.toLocaleString("vi-VN")} ₫
        </p>
        <span className={`badge ${inStock ? "bg-success" : "bg-secondary"}`}>
          {inStock ? `Còn ${product.stock}` : "Hết hàng"}
        </span>
      </div>
    </Link>
  );
};

export default ProductCard;
