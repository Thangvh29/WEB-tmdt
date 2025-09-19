// frontend/src/pages/user/UserProductsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import api from "../../services/axios";
import ProductCard from "../../components/user/ProductCard";
import Filters from "../../components/user/Filters";
import "../../assets/style/user-products.css";

const initialFilters = {
  q: "",
  isNew: "",
  brand: "",
  type: "",
  category: "",
  minPrice: "",
  maxPrice: "",
  sort: "newest",
  page: 1,
  limit: 12,
};

const UserProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (
          value !== "" &&
          value !== undefined &&
          value !== null &&
          !(typeof value === "number" && isNaN(value)) &&
          key !== "isNew"
        ) {
          params[key] = value;
        }
      });

      let endpoint = "/user/products";
      if (filters.isNew === "true") endpoint = "/user/products/new";
      else if (filters.isNew === "false") endpoint = "/user/products/old";

      console.log("🔎 [UserProductsPage] Fetching:", endpoint, params, "with isNew =", filters.isNew);

      const { data } = await api.get(endpoint, { params });

      console.log("✅ [UserProductsPage] Response:", data);

      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("❌ [UserProductsPage] Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleFilterChange = (newFilters) => {
    console.log("⚡ [UserProductsPage] Filters changed:", newFilters);
    setFilters(newFilters);
  };

  const handlePageChange = (newPage) =>
    setFilters((prev) => ({ ...prev, page: newPage }));

  const totalPages = Math.ceil(total / filters.limit);

  return (
    <div className="user-products-page">
      <h1>Sản phẩm</h1>
      <Filters filters={filters} onFilterChange={handleFilterChange} />

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className="products-grid">
          {products.length > 0 ? (
            products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))
          ) : (
            <p>Không có sản phẩm nào.</p>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => handlePageChange(i + 1)}
              className={filters.page === i + 1 ? "active" : ""}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserProductsPage;
