// frontend/src/components/user/ProductCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import "../../assets/style/product-card.css";
import { backendURL } from "../../services/axios";

const ProductCard = ({ product }) => {
  const inStock = product.stock > 0;
  const price =
    product.priceRange?.min === product.priceRange?.max
      ? product.priceRange?.min
      : `${product.priceRange?.min} - ${product.priceRange?.max}`;

  const format = (n) =>
    n?.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  return (
    <Link
      to={`/user/products/${product._id}`}
      className="block border rounded-xl p-3 hover:shadow-md relative"
    >
      {!inStock && (
        <span className="absolute top-2 left-2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
          Hết hàng
        </span>
      )}
      <img
        src={
          product.images?.[0]
            ? `${backendURL}/uploads/product/${product.images[0]}`
            : "/placeholder.png"
        }
        alt={product.name}
        className="w-full h-44 object-cover rounded-md mb-3"
        loading="lazy"
      />
      <div className="text-sm text-gray-500 capitalize">
        {product.brand} • {product.type}
      </div>
      <div className="font-medium line-clamp-2 leading-snug">{product.name}</div>
      <div className="mt-2 text-black font-semibold">
        {format(product.priceRange?.min)}
        {product.priceRange?.max &&
        product.priceRange.min !== product.priceRange.max
          ? ` - ${format(product.priceRange?.max)}`
          : ""}
      </div>
      {/* Hiển thị số lượng tồn kho */}
      <div className="text-xs text-gray-500 mt-1">
        {inStock
          ? `Còn ${product.stock} sản phẩm`
          : "Hết hàng"}{" "}
        • Đã bán: {product.sold ?? 0}
      </div>
    </Link>
  );
};

export default ProductCard;
