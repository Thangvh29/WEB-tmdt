// src/components/user/ProductCard.jsx
import React from "react";

const ProductCard = ({ product, onViewDetail, onAddToCart }) => {
  return (
    <div className="product-card border rounded-lg shadow-sm bg-white hover:shadow-md transition duration-200 flex flex-col">
      {/* Hình ảnh sản phẩm */}
      <div className="relative">
        <img
          src={product.images?.[0] || "/no-image.png"}
          alt={product.name}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        {product.stock === 0 && (
          <span className="absolute top-2 left-2 bg-gray-600 text-white text-xs px-2 py-1 rounded">
            Hết hàng
          </span>
        )}
      </div>

      {/* Nội dung */}
      <div className="p-3 flex flex-col flex-1">
        <h6
          className="font-semibold text-sm line-clamp-2 mb-1"
          title={product.name}
        >
          {product.name}
        </h6>
        <p className="text-xs text-gray-500 mb-2">
          {product.brand} • {product.type}
        </p>

        {/* Giá */}
        <p className="text-red-600 font-bold text-base mb-2">
          {Number(product.price || 0).toLocaleString()} ₫
        </p>

        {/* Trạng thái kho */}
        <span
          className={`text-xs font-medium ${
            product.stock > 0 ? "text-green-600" : "text-gray-400"
          } mb-3`}
        >
          {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : "Hết hàng"}
        </span>

        {/* Nút hành động */}
        <div className="mt-auto flex gap-2">
          <button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded"
            onClick={() => onViewDetail(product._id)}
          >
            Xem chi tiết
          </button>
          {product.stock > 0 && (
            <button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2 rounded"
              onClick={() => onAddToCart(product._id)}
            >
              Mua ngay
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
