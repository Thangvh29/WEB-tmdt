// src/pages/Products.jsx
import React, { useEffect, useState } from "react";
import api from "../services/axios"; // dùng axios đã config sẵn (baseURL = /api)

import Filters from "../components/user/Filters";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
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
  });
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 12 });
  const [loading, setLoading] = useState(true);

  // fetch products
  const fetchProducts = async (appliedFilters = filters) => {
    try {
      setLoading(true);
      const { data } = await api.get("/user/products", { params: appliedFilters });

      setProducts(data.products || []);
      setMeta({ total: data.total, page: data.page, limit: data.limit });
    } catch (err) {
      console.error("Lỗi khi tải sản phẩm:", err);
    } finally {
      setLoading(false);
    }
  };

  // fetch khi mount hoặc khi filters thay đổi
  useEffect(() => {
    fetchProducts(filters);
  }, [filters]);

  // xử lý thay đổi filter
  const handleFilterChange = (updatedFilters) => {
    setFilters({ ...filters, ...updatedFilters, page: 1 }); // reset về page 1
  };

  // phân trang
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= Math.ceil(meta.total / meta.limit)) {
      setFilters({ ...filters, page: newPage });
    }
  };

  return (
    <div className="flex">
      {/* Sidebar Filters */}
      <aside className="w-1/4 p-4 border-r border-gray-200">
        <Filters
          filters={filters}
          selectedFilters={filters}
          onFilterChange={handleFilterChange}
        />
      </aside>

      {/* Danh sách sản phẩm */}
      <main className="w-3/4 p-4">
        {loading ? (
          <p>Đang tải sản phẩm...</p>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-4">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="border p-2 rounded shadow hover:shadow-lg"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-40 object-cover"
                  />
                  <h3 className="text-lg font-semibold mt-2">{product.name}</h3>
                  <p className="text-gray-600">
                    {product.priceDisplay.toLocaleString()}₫
                  </p>
                  <p className="text-sm text-gray-500">
                    {product.isNewProduct ? "Sản phẩm mới" : "Sản phẩm cũ"}
                  </p>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                onClick={() => handlePageChange(meta.page - 1)}
                disabled={meta.page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                ⬅ Trước
              </button>
              <span>
                Trang {meta.page} / {Math.ceil(meta.total / meta.limit)}
              </span>
              <button
                onClick={() => handlePageChange(meta.page + 1)}
                disabled={meta.page >= Math.ceil(meta.total / meta.limit)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Sau ➡
              </button>
            </div>
          </>
        ) : (
          <p>Không tìm thấy sản phẩm nào.</p>
        )}
      </main>
    </div>
  );
};

export default Products;
