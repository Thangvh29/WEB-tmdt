// src/pages/admin/InventoryPage.jsx
import React, { useState, useEffect } from "react";
import api from "../../services/axios";
import InventoryProductCard from "../../components/admin/InventoryProductCard";

const InventoryPage = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Fetch inventory list
  const fetchInventory = async (pageNum = 1) => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/inventory/list", {
        params: { page: pageNum, limit },
      });
      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
      setPage(pageNum);
    } catch (err) {
      console.error("Lỗi khi load inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  // Update stock API
  const handleUpdateStock = async (productId, stock, variantId) => {
    try {
      const { data } = await api.patch(`/admin/inventory/${productId}/stock`, {
        stock,
        variantId,
      });
      console.log("Cập nhật tồn kho thành công:", data);

      // Cập nhật lại danh sách (cách đơn giản: fetch lại)
      fetchInventory(page);
    } catch (err) {
      console.error("Lỗi cập nhật tồn kho:", err);
      alert("Cập nhật tồn kho thất bại");
    }
  };

  useEffect(() => {
    fetchInventory(1);
  }, []);

  return (
    <div className="inventory-page">
      <h2>Quản lý tồn kho</h2>
      {loading && <p>Đang tải dữ liệu...</p>}

      <div className="inventory-list">
        {products.length === 0 && !loading && <p>Không có sản phẩm</p>}
        {products.map((p) => (
          <InventoryProductCard
            key={p._id}
            product={p}
            onUpdateStock={handleUpdateStock}
          />
        ))}
      </div>

      {/* Phân trang đơn giản */}
      <div className="pagination">
        <button disabled={page <= 1} onClick={() => fetchInventory(page - 1)}>
          Trang trước
        </button>
        <span>
          Trang {page} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => fetchInventory(page + 1)}
        >
          Trang sau
        </button>
      </div>
    </div>
  );
};

export default InventoryPage;
