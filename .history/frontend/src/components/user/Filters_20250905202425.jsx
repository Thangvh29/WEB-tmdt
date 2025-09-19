// frontend/src/components/user/Filters.jsx
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
        const { data } = await api.get("/user/categories");
        const cats = Array.isArray(data?.data) ? data.data : [];
        setCategories(cats);
        console.log("📂 [Filters] Categories loaded:", cats);
      } catch (err) {
        console.error("[Filters] Lỗi khi lấy categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;

    if (name === "minPrice" || name === "maxPrice") {
      parsedValue = value !== "" ? Number(value) : "";
    }

    console.log(`🎛️ [Filters] Changed: ${name} =`, parsedValue);

    onFilterChange({ ...filters, [name]: parsedValue, page: 1 });
  };

  const handleReset = () => {
    console.log("♻️ [Filters] Reset filters");
    onFilterChange({ ...defaultFilters, page: 1, limit: filters.limit });
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

      {/* Brand */}
      <input
        type="text"
        name="brand"
        placeholder="Hãng"
        value={filters.brand || ""}
        onChange={handleChange}
        className="border p-2 rounded w-32"
      />

      {/* Type */}
      <select
        name="type"
        value={filters.type || ""}
        onChange={handleChange}
        className="border p-2 rounded"
      >
        <option value="">Loại</option>
        <option value="laptop">Laptop</option>
        <option value="gpu">GPU</option>
        <option value="phone">Điện thoại</option>
        <option value="tablet">Tablet</option>
        <option value="monitor">Màn hình</option>
      </select>

      {/* Category */}
      <select
        name="category"
        value={filters.category || ""}
        onChange={handleChange}
        className="border p-2 rounded"
      >
        <option value="">Danh mục</option>
        {categories.map((cat) => (
          <option key={cat._id} value={cat._id}>
            {cat.nam
