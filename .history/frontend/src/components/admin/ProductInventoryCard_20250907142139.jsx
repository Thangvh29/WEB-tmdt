import React, { useState } from "react";
import "../../assets/style/product-card.css";

const InventoryProductCard = ({ product, onUpdateStock }) => {
  const [productStock, setProductStock] = useState(product.stock);
  const [variantStocks, setVariantStocks] = useState(
    (product.variants || []).reduce((acc, v) => {
      acc[v._id] = v.stock || 0;
      return acc;
    }, {})
  );

  const handleProductStockChange = (e) => {
    setProductStock(Number(e.target.value));
  };

  const handleVariantStockChange = (variantId, value) => {
    setVariantStocks((prev) => ({ ...prev, [variantId]: Number(value) }));
  };

  // Lấy ảnh: ưu tiên product.image, nếu không thì lấy images[0], nếu vẫn không có thì dùng ảnh mặc định
  const imageUrl =
    product.image ||
    (product.images && product.images.length > 0 ? product.images[0] : "/default-image.png");

  return (
    <div className="product-card">
      <img src={imageUrl} alt={product.name} />
      <h4>{product.name}</h4>
      <p>Brand: {product.brand}</p>
      <p>Type: {product.type}</p>
      <p>
        Stock tổng:{" "}
        <input
          type="number"
          value={productStock}
          min={0}
          onChange={handleProductStockChange}
        />{" "}
        <button onClick={() => onUpdateStock(product._id, productStock)}>
          Cập nhật
        </button>
      </p>
      {product.variants && product.variants.length > 0 && (
        <div className="variant-section">
          <h5>Variants</h5>
          {product.variants.map((v) => (
            <div key={v._id} className="variant-item">
              <span>{v.attributes.join(", ")}</span>
              <input
                type="number"
                value={variantStocks[v._id]}
                min={0}
                onChange={(e) => handleVariantStockChange(v._id, e.target.value)}
              />
              <button onClick={() => onUpdateStock(product._id, variantStocks[v._id], v._id)}>
                Cập nhật
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InventoryProductCard;
