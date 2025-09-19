// frontend/src/components/user/ProductCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import "../../assets/style/post-card.css";
import { backendURL } from "../../services/axios";

const ProductCard = ({ product }) => {
  const inStock = product.stock > 0;

  // Hàm chuẩn hóa ảnh
  const getImageUrl = (img) => {
    if (!img) return "/placeholder.png";
    return img.startsWith("http") ? img : `${backendURL}${img}`;
  };

  // Giá hiển thị
  const formatCurrency = (n) =>
    n?.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  const price =
    product.priceRange?.min === product.priceRange?.max
      ? formatCurrency(product.priceRange?.min)
      : `${formatCurrency(product.priceRange?.min)} - ${formatCurrency(
          product.priceRange?.max
        )}`;

  return (
    <Link
      to={`/user/products/${product._id}`}
      className="block border rounded-xl p-3 hover:shadow-md relative bg-white"
    >
      {/* Badge hết hàng */}
      {!inStock && (
        <span className="absolute top-2 left-2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
          Hết hàng
        </span>
      )}

      {/* Ảnh sản phẩm */}
      <img
  src={product.image || "/placeholder.png"}
  alt={product.name}
  className="w-full h-44 object-cover rounded-md mb-3"
  loading="lazy"
/>


      {/* Brand + Type */}
      <div className="text-sm text-gray-500 capitalize">
        {product.brand} • {product.type}
      </div>

      {/* Tên sản phẩm */}
      <div className="font-medium line-clamp-2 leading-snug">{product.name}</div>

      {/* Giá */}
      <div className="mt-2 text-black font-semibold">{price}</div>

      {/* Tồn kho + Đã bán */}
      <div className="text-xs text-gray-500 mt-1">
        {inStock ? `Còn ${product.stock} sản phẩm` : "Hết hàng"} • Đã bán:{" "}
        {product.sold ?? 0}
      </div>
    </Link>
  );
};

export default ProductCard;
