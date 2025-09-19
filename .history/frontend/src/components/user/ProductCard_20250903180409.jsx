// frontend/src/components/user/ProductCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import "../../assets/style/product-card.css";

const ProductCard = ({ product }) => {
  const inStock = product.stock > 0;

  // Base URL từ .env hoặc mặc định localhost
  const base = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Xử lý đường dẫn ảnh
  const imageUrl = product.images?.[0]
    ? product.images[0].startsWith("http")
      ? product.images[0]
      : `${base}/${product.images[0]}`
    : "/default-product.png";

  // Format tiền tệ
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

      {/* Hình ảnh sản phẩm */}
      <img
        src={imageUrl}
        alt={product.name}
        className="w-full h-44 object-cover rounded-md mb-3"
        loading="lazy"
      />

      {/* Brand + Type */}
      <div className="text-sm text-gray-500 capitalize">
        {product.brand} • {product.type}
      </div>

      {/* Tên sản phẩm */}
      <div className="font-medium line-clamp-2 leading-snug">
        {product.name}
      </div>

      {/* Giá */}
      <div className="mt-2 text-red-600 font-semibold">
        {format(product.priceRange?.min)}
        {product.priceRange?.max &&
        product.priceRange.min !== product.priceRange.max
          ? ` - ${format(product.priceRange?.max)}`
          : ""}
      </div>

      {/* Thông tin thêm */}
      <div className="text-xs text-gray-500 mt-1">
        {product.isNewProduct ? "Sản phẩm mới" : "Sản phẩm cũ"} • Đã bán:{" "}
        {product.sold ?? 0}
      </div>
    </Link>
  );
};

export default ProductCard;
