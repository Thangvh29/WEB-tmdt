// src/pages/Products.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import Filters from "../components/Filters";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState({});

  // Lấy danh sách sản phẩm
  const fetchProducts = async (appliedFilters = {}) => {
    try {
      setLoading(true);
      const res = await axios.get("/api/products", { params: appliedFilters });
      setProducts(res.data);
    } catch (err) {
      console.error("Lỗi khi tải sản phẩm:", err);
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách filters từ API
  const fetchFilters = async () => {
    try {
      const res = await axios.get("/api/filters");
      setFilters(res.data);
    } catch (err) {
      console.error("Lỗi khi tải filters:", err);
    }
  };

  // gọi API khi component mount
  useEffect(() => {
    fetchProducts();
    fetchFilters();
  }, []);

  // xử lý khi filter thay đổi
  const handleFilterChange = (updatedFilters) => {
    setSelectedFilters(updatedFilters);
    fetchProducts(updatedFilters); // gọi lại API với filter mới
  };

  return (
    <div className="flex">
      {/* Sidebar Filters */}
      <aside className="w-1/4 p-4 border-r border-gray-200">
        <Filters
          filters={filters}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
        />
      </aside>

      {/* Danh sách sản phẩm */}
      <main className="w-3/4 p-4">
        {loading ? (
          <p>Đang tải sản phẩm...</p>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="border p-2 rounded shadow hover:shadow-lg"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-40 object-cover"
                />
                <h3 className="text-lg font-semibold mt-2">{product.name}</h3>
                <p className="text-gray-600">{product.price}₫</p>
              </div>
            ))}
          </div>
        ) : (
          <p>Không tìm thấy sản phẩm nào.</p>
        )}
      </main>
    </div>
  );
};

export default Products;
