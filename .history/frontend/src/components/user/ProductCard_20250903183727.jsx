import React from "react";
import { Link } from "react-router-dom";
import "../../assets/style/product-card.css";

const ProductCard = ({ product }) => {
  const inStock = product.stock > 0;

  const format = (n) =>
    n?.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  // Sử dụng VITE_BACKEND_URL từ .env
  const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  const imageUrl = product.images?.[0]
    ? `${baseUrl}/uploads/product/${product.images[0]}`
    : "/no-image.png";

  // Debug logs
  console.log("Product name:", product.name);
  console.log("Product images:", product.images);
  console.log("Constructed image URL:", imageUrl);

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

      {/* Ảnh sản phẩm */}
      <img
        src={imageUrl}
        alt={product.name}
        className="w-full h-44 object-cover rounded-md mb-3"
        loading="lazy"
        onError={(e) => {
          console.log("Image load error for:", product.name, "URL:", imageUrl);
          e.target.src = "/no-image.png";
        }}
      />

      {/* Thông tin thêm */}
      <div className="text-sm text-gray-500 capitalize">
        {product.brand} • {product.type}
      </div>
      <div className="font-medium line-clamp-2 leading-snug">{product.name}</div>

      {/* Giá */}
      <div className="mt-2 text-red-600 font-semibold">
        {format(product.priceRange?.min)}
        {product.priceRange?.max &&
        product.priceRange.min !== product.priceRange.max
          ? ` - ${format(product.priceRange?.max)}`
          : ""}
      </div>

      <div className="text-xs text-gray-500 mt-1">
        {product.isNewProduct ? "Sản phẩm mới" : "Sản phẩm cũ"} • Đã bán:{" "}
        {product.sold ?? 0}
      </div>
    </Link>
  );
};

export default ProductCard;