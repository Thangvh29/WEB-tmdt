// src/components/user/ProductCard.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { getImageUrl } from "../../utils/image.js";
import "../../assets/style/product-card.css";

const ProductCard = ({ product }) => {
  const [activeImage, setActiveImage] = useState(
    getImageUrl(product.images?.[0])
  );

  const price = product.variants?.length
    ? Math.min(...product.variants.map((v) => v.price))
    : product.price;

  const inStock =
    product.variants?.some((v) => v.stock > 0) || product.stock > 0;

  return (
    <div className="product-card shadow-sm">
      <Link to={`/user/products/${product._id}`} className="card-link">
        {/* Gallery */}
        <div className="image-wrapper">
          <img
            src={activeImage}
            alt={product.name}
            className="main-image"
          />
          {product.images?.length > 1 && (
            <div className="thumbs">
              {product.images.slice(0, 4).map((img, idx) => (
                <img
                  key={idx}
                  src={getImageUrl(img)}
                  alt={`${product.name} ${idx}`}
                  className={`thumb ${
                    activeImage === getImageUrl(img) ? "active" : ""
                  }`}
                  onMouseEnter={() => setActiveImage(getImageUrl(img))}
                  onClick={() => setActiveImage(getImageUrl(img))}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="info">
          <h6 className="name" title={product.name}>
            {product.name}
          </h6>
          <p className="brand-type">
            {product.brand} - {product.type}
          </p>
          <p className="price">{Number(price).toLocaleString()} ₫</p>
          <span className={`badge ${inStock ? "bg-success" : "bg-secondary"}`}>
            {inStock ? "Còn hàng" : "Hết hàng"}
          </span>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
