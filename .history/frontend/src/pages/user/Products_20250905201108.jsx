// src/pages/user/Products.jsx
import React, { useEffect, useState } from "react";
import api from "../../services/axios";
import Filters from "../../components/user/Filters";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);

  // Gọi API theo filters
  const fetchProducts = async (appliedFilters = {}) => {
    try {
      setLoading(true);

      let url = "/user/products";
      if (appliedFilters.isNew === "true") {
        url = "/user/products/new";
      } else if (appliedFilters.isNew === "false") {
        url = "/user/products/old";
      }

      const { data } = await api.get(url, { params: appliedFilters });

      // Admin và User controller có thể trả khác nhau
      // => Chuẩn hóa về mảng `products`
      const list = data.products || data;
      setProducts(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Lỗi khi tải sản phẩm:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách filters từ API (nếu có)
  const fetchFilters = async () => {
    try {
      const res = await api.get("/user/products/filters");
      setFilters((prev) => ({ ...prev, ...res.data }));
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
    setFilters(updatedFilters);
    fetchProducts(updatedFilters); // gọi lại API với filter mới
  };

  return (
    <div className="flex">
      {/* Sidebar Filters */}
      <aside className="w-1/4 p-4 border-r border-gray-200">
        <Filters filters={filters} onFilterChange={handleFilterChange} />
      </aside>

      {/* Danh sách sản phẩm */}
      <main className="w-3/4 p-4">
        {loading ? (
          <p>Đang tải sản phẩm...</p>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {products.map((product) => (
              <div
                key={product._id || product.id}
                className="border p-2 rounded shadow hover:shadow-lg"
              >
                <img
                  src={product.image || (product.images?.[0] ?? "")}
                  alt={product.name}
                  className="w-full h-40 object-cover"
                />
                <h3 className="text-lg font-semibold mt-2">{product.name}</h3>
                <p className="text-gray-600">
                  {product.priceDisplay ??
                    product.price ??
                    (product.priceRange?.min || 0)}
                  ₫
                </p>
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
