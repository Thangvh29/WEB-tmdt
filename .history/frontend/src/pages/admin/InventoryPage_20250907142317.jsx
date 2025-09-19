import React, { useState, useEffect } from "react";
import api from "../../services/axios";
import InventoryProductCard from "../../components/admin/InventoryProductCard";
import "../../assets/style/admin-products.css";
import "../../assets/style/product-list.css";
import "../../assets/style/inventory-admin.css";

const TYPE_OPTIONS = [
  { value: "", label: "Loại" },
  { value: "laptop", label: "Laptop" },
  { value: "gpu", label: "GPU" },
  { value: "monitor", label: "Màn hình" },
  { value: "cpu", label: "CPU" },
  { value: "mainboard", label: "Mainboard" },
  { value: "ram", label: "RAM" },
  { value: "storage", label: "Ổ cứng" },
  { value: "fan", label: "Quạt" },
  { value: "keyboard", label: "Bàn phím" },
  { value: "mouse", label: "Chuột" },
  { value: "mousepad", label: "Lót chuột" },
  { value: "headphone", label: "Tai nghe" },
  { value: "light", label: "Đèn" },
  { value: "accessory", label: "Phụ kiện" },
];

const InventoryPage = () => {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    name: "",
    brand: "",
    type: "",
    stockStatus: "all",
  });
  const [productType, setProductType] = useState("new");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, productType]);

  const fetchProducts = async () => {
    try {
      setError("");
      const queryParams = Object.fromEntries(
        Object.entries(filters).filter(
          ([k, v]) => v !== "" && !(k === "stockStatus" && v === "all")
        )
      );

      const endpoint =
        productType === "new" ? "/admin/products/new" : "/admin/products/old";
      const { data } = await api.get(endpoint, { params: queryParams });
      setProducts(data.products || []);
    } catch (err) {
      console.error("Lỗi tải tồn kho:", err);
      setError(err.response?.data?.message || "Lỗi tải tồn kho");
    }
  };

  const handleUpdateStock = async (productId, stock, variantId) => {
    try {
      await api.patch(`/admin/inventory/${productId}/stock`, {
        stock,
        variantId,
      });
      fetchProducts();
    } catch (err) {
      console.error("Lỗi cập nhật stock:", err);
      alert("Cập nhật tồn kho thất bại");
    }
  };

  const handleInputChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div className="products-page inventory-page">
      <h2>Quản lý tồn kho</h2>

      <div className="tabs mb-3">
        <button
          type="button"
          className={`tab ${productType === "new" ? "active" : ""}`}
          onClick={() => setProductType("new")}
        >
          Sản phẩm mới
        </button>
        <button
          type="button"
          className={`tab ${productType === "old" ? "active" : ""}`}
          onClick={() => setProductType("old")}
        >
          Sản phẩm cũ
        </button>
      </div>

      <form
        className="w-100 d-flex gap-2 align-items-stretch mb-3"
        onSubmit={handleSubmit}
      >
        <input
          className="form-control"
          name="name"
          value={filters.name}
          onChange={handleInputChange}
          placeholder="Tên sản phẩm"
        />
        <input
          className="form-control"
          name="brand"
          value={filters.brand}
          onChange={handleInputChange}
          placeholder="Hãng"
        />
        <select
          className="form-select"
          name="type"
          value={filters.type}
          onChange={handleInputChange}
        >
          {TYPE_OPTIONS.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
        <select
          className="form-select"
          name="stockStatus"
          value={filters.stockStatus}
          onChange={handleInputChange}
        >
          <option value="all">Tồn kho</option>
          <option value="inStock">Còn hàng</option>
          <option value="outOfStock">Hết hàng</option>
        </select>
        <button className="btn btn-primary">Lọc</button>
      </form>

      {error && <p className="error-message">{error}</p>}

      <div className="product-grid">
        {products.length > 0 ? (
          products.map((product) => (
            <InventoryProductCard
              key={product._id}
              product={product}
              onUpdateStock={handleUpdateStock}
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
