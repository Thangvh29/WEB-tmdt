// frontend/src/components/user/Filters.jsx
import React, { useEffect, useState } from "react";
import api from "../../services/axios";

const Filters = ({ filters, onFilterChange }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch categories giống như admin/ProductForm
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/user/categories"); // gọi API user
        setCategories(data || []);
        setMessage("");
      } catch (err) {
        console.error("Lỗi tải categories:", err);
        setMessage("⚠️ Lỗi tải danh mục, vui lòng thử lại");
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Update filters
  const handleChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;

    if (name === "isNew" && value !== "") {
      parsedValue = value === "true";
    }
    if ((name === "minPrice" || name === "maxPrice") && value !== "") {
      parsedValue = Number(value);
    }

    onFilterChange({ ...filters, [name]: parsedValue });
  };

  // Reset filters
  const handleReset = () => {
    onFilterChange({
      q: "",
      isNew: "",
      brand: "",
      type: "",
      category: "",
      minPrice: "",
      maxPrice: "",
      sort: "newest",
    });
  };

  return (
    <div className="filters w-full flex flex-wrap items-center gap-2 p-3 border rounded-md mb-4 bg-white shadow-sm">
      {/* search */}
      <input
        type="text"
        name="q"
        placeholder="🔍 Tìm kiếm sản phẩm"
        value={filters.q || ""}
        onChange={handleChange}
        className="border p-2 rounded flex-1 min-w-[200px]"
      />

      {/* trạng thái mới/cũ */}
      <select
        name="isNew"
        value={filters.isNew ?? ""}
        onChange={handleChange}
        className="border p-2 rounded"
      >
        <option value="">Mới / Cũ</option>
        <option value="true">Mới</option>
        <option value="false">Cũ</option>
      </select>

      {/* hãng */}
      <input
        type="text"
        name="brand"
        placeholder="Hãng"
        value={filters.brand || ""}
        onChange={handleChange}
        className="border p-2 rounded w-32"
      />

      {/* type */}
      <select
        name="type"
        value={filters.type || ""}
        onChange={handleChange}
        className="border p-2 rounded"
      >
        <option value="">Loại</option>
        <option value="laptop">Laptop</option>
        <option value="gpu">GPU</option>
        <option value="monitor">Màn hình</option>
        <option value="cpu">CPU</option>
        <option value="ram">RAM</option>
        <option value="accessory">Phụ kiện</option>
      </select>

      {/* category */}
      <select
        name="category"
        value={filters.category || ""}
        onChange={handleChange}
        className="border p-2 rounded"
      >
        <option value="">Danh mục</option>
        {loading && <option disabled>Đang tải...</option>}
        {!loading &&
          categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
      </select>

      {/* price range */}
      <input
        type="number"
        name="minPrice"
        placeholder="Giá min"
        value={filters.minPrice || ""}
        onChange={handleChange}
        className="border p-2 rounded w-24"
        min={0}
      />
      <input
        type="number"
        name="maxPrice"
        placeholder="Giá max"
        value={filters.maxPrice || ""}
        onChange={handleChange}
        className="border p-2 rounded w-24"
        min={0}
      />

      {/* sort */}
      <select
        name="sort"
        value={filters.sort || "newest"}
        onChange={handleChange}
        className="border p-2 rounded"
      >
        <option value="newest">Mới nhất</option>
        <option value="priceAsc">Giá tăng</option>
        <option value="priceDesc">Giá giảm</option>
        <option value="popular">Phổ biến</option>
      </select>

      {/* reset */}
      <button
        type="button"
        onClick={handleReset}
        className="ml-auto bg-gray-100 px-3 py-2 rounded border hover:bg-gray-200"
      >
        ❌ Reset
      </button>

      {message && (
        <div className="w-full text-red-500 text-sm mt-1">{message}</div>
      )}
    </div>
  );
};

export default Filters;
