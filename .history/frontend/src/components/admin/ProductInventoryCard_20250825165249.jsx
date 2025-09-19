// src/components/admin/Inventory/InventoryProductCard.jsx
import React, { useState } from "react";
import api from "../../../services/axios";
import "../../assets/style/product-card.css";

const InventoryProductCard = ({ product, onStockChange }) => {
  const [stock, setStock] = useState(product.stock);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const handleStockUpdate = async (newStock) => {
    try {
      setError("");
      setUpdating(true);
      await api.patch(`/admin/inventory/${product._id}/stock`, { stock: newStock });
      setStock(newStock);
      onStockChange?.(product._id, newStock);
    } catch (err) {
      console.error("Lỗi cập nhật tồn kho:", err);
      setError(err.response?.data?.message || "Lỗi cập nhật tồn kho");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="inventory-card">
      <img src={product.image || "/default-product.png"} alt={product.name} />
      <div className="inventory-card__info">
        <h4>{product.name}</h4>
        <p>Brand: {product.brand}</p>
        <p>Type: {product.type}</p>
        <p>Status: <strong>{stock > 0 ? "inStock" : "outOfStock"}</strong></p>
        <div className="inventory-card__stock">
          <label>Số lượng:</label>
          <input
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            disabled={updating}
          />
          <button onClick={() => handleStockUpdate(stock)} disabled={updating}>
            {updating ? "Đang cập nhật..." : "Cập nhật"}
          </button>
        </div>
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default InventoryProductCard;
