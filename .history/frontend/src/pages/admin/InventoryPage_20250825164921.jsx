import React, { useState, useEffect } from "react";
import api from "../../services/axios";
import InventoryProductCard from "../../components/admin/";
import "../../assets/style/product-list.css";

const InventoryPage = () => {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    name: "",
    brand: "",
    type: "",
    stockStatus: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const queryParams = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== "")
      );
      const { data } = await api.get("/admin/inventory/list", { params: queryParams });
      setProducts(data.products || []);
    } catch (err) {
      console.error("Lỗi tải kho:", err);
      setError(err.response?.data?.message || "Lỗi tải danh sách kho");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const handleUpdateStock = async (productId, stock, variantId) => {
    try {
      setError("");
      await api.patch(`/admin/inventory/${productId}/stock`, { stock, variantId });
      fetchProducts(); // Refetch sau khi update
    } catch (err) {
      console.error("Lỗi cập nhật tồn kho:", err);
      setError(err.response?.data?.message || "Cập nhật tồn kho thất bại");
    }
  };

  return (
    <div className="product-list-page">
      <h3>Quản lý kho hàng</h3>
      {error && <p className="error-message">{error}</p>}
      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : (
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
      )}
    </div>
  );
};

export default InventoryPage;
