// src/pages/admin/InventoryPage.jsx
import React, { useState, useEffect } from "react";
import api from "../../services/axios";
import InventoryProductCard from "../../components/admin/ProductInventoryCard";;
import '../../assets/style/admin-products.css';
import "../../assets/style/product-list.css";
import "../../assets/style/";
const InventoryPage = () => {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    name: "",
    brand: "",
    type: "",
    stockStatus: "",
  });
  const [productType, setProductType] = useState("new"); // new hoặc old
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProducts();
  }, [filters, productType]);

  const fetchProducts = async () => {
    try {
      setError("");
      const queryParams = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== "")
      );

      const endpoint = productType === "new" ? "/admin/products/new" : "/admin/products/old";
      const { data } = await api.get(endpoint, { params: queryParams });
      setProducts(data.products || []);
    } catch (err) {
      console.error("Lỗi tải tồn kho:", err);
      setError(err.response?.data?.message || "Lỗi tải tồn kho");
    }
  };

  const handleStockChange = (productId, newStock) => {
    setProducts((prev) =>
      prev.map((p) => (p._id === productId ? { ...p, stock: newStock } : p))
    );
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="inventory-page">
      <h3>Quản lý tồn kho</h3>

      {/* Loại sản phẩm */}
      <div className="product-type-toggle">
        <button
          className={productType === "new" ? "active" : ""}
          onClick={() => setProductType("new")}
        >
          Sản phẩm mới
        </button>
        <button
          className={productType === "old" ? "active" : ""}
          onClick={() => setProductType("old")}
        >
          Sản phẩm cũ
        </button>
      </div>

      {/* Filter */}
      <div className="product-filters">
        <input
          type="text"
          name="name"
          placeholder="Tên sản phẩm"
          value={filters.name}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          name="brand"
          placeholder="Thương hiệu"
          value={filters.brand}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          name="type"
          placeholder="Loại"
          value={filters.type}
          onChange={handleFilterChange}
        />
        <select
          name="stockStatus"
          value={filters.stockStatus}
          onChange={handleFilterChange}
        >
          <option value="">Tất cả</option>
          <option value="inStock">Còn hàng</option>
          <option value="outOfStock">Hết hàng</option>
        </select>
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="product-grid">
        {products.length > 0 ? (
          products.map((product) => (
            <InventoryProductCard
              key={product._id}
              product={product}
              onStockChange={handleStockChange}
            />
          ))
        ) : (
          <p>Không có sản phẩm nào</p>
        )}
      </div>
    </div>
  );
};

export default InventoryPage;
