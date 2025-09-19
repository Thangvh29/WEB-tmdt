// frontend/src/components/auth/Filters.jsx
import React, { useEffect, useState } from "react";
import api from "../../services/axios";

const defaultFilters = {
  q: "",
  isNew: "",
  brand: "",
  type: "",
  category: "",
  minPrice: "",
  maxPrice: "",
  sort: "newest",
};

const Filters = ({ filters, onFilterChange }) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get("/categories");
        setCategories(Array.isArray(data?.data) ? data.data : []);
      } catch (err) {
        console.error("Error loading categories:", err);
      }
    };
    fetchCategories();
  }, []);

const handleChange = (e) => {
  const { name, value } = e.target;
  const parsedValue =
    name === "minPrice" || name === "maxPrice"
      ? value !== "" ? Number(value) : ""
      : value;

  const newFilters = { ...filters, [name]: parsedValue, page: 1 };

  console.log("🎛️ [Filters] Changed:", name, "=", parsedValue);
  console.log("📦 [Filters] Current filters:", newFilters);

  onFilterChange(newFilters);
};

const handleReset = () => {
  const resetFilters = { ...defaultFilters, page: 1, limit: filters.limit };
  console.log("♻️ [Filters] Reset filters:", resetFilters);
  onFilterChange(resetFilters);
};

  return (
    <div className="filters w-full flex flex-wrap items-center gap-2 p-3 border rounded-md mb-4 bg-white shadow-sm">
      <input
        type="text"
        name="q"
        placeholder="🔍 Tìm kiếm sản phẩm"
        value={filters.q || ""}
        onChange={handleChange}
        className="border p-2 rounded flex-1 min-w-[200px]"
      />

      <select name="isNew" value={filters.isNew ?? ""} onChange={handleChange} className="border p-2 rounded">
        <option value="">Mới / Cũ</option>
        <option value="true">Mới</option>
        <option value="false">Cũ</option>
      </select>

      <input
        type="text"
        name="brand"
        placeholder="Hãng"
        value={filters.brand || ""}
        onChange={handleChange}
        className="border p-2 rounded w-32"
      />

      <select name="type" value={filters.type || ""} onChange={handleChange} className="border p-2 rounded">
        <option value="">Loại</option>
        <option value="laptop">Laptop</option>
        <option value="gpu">GPU</option>
        <option value="phone">Điện thoại</option>
        <option value="tablet">Tablet</option>
        <option value="monitor">Màn hình</option>
      </select>

      <select name="category" value={filters.category || ""} onChange={handleChange} className="border p-2 rounded">
        <option value="">Danh mục</option>
        {categories.map((cat) => (
          <option key={cat._id} value={cat._id}>{cat.name}</option>
        ))}
      </select>

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

      <select name="sort" value={filters.sort || "newest"} onChange={handleChange} className="border p-2 rounded">
        <option value="newest">Mới nhất</option>
        <option value="priceAsc">Giá tăng</option>
        <option value="priceDesc">Giá giảm</option>
        <option value="popular">Phổ biến</option>
      </select>

      <button type="button" onClick={handleReset} className="ml-auto bg-gray-100 px-3 py-2 rounded border hover:bg-gray-200">
        ❌ Reset
      </button>
    </div>
  );
};

export default Filters;
