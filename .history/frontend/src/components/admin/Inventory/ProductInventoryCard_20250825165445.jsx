import React, { useState } from "react";
import "../../assets/styl";

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

  return (
    <div className="product-card">
      <img src={product.image || "/default-image.png"} alt={product.name} />
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
        <button onClick={() => onUpdateStock(product._id, productStock)}>Cập nhật</button>
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
