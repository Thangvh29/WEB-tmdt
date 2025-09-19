// frontend/src/components/user/Filters.jsx
import React, { useEffect, useState } from "react";
import api from "../../services/axios";

const Filters = ({ filters, onFilterChange }) => {
  const [categories, setCategories] = useState([]);

  // Load categories từ API khi component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log("[Filters] Fetching categories...");
        const { data } = await api.get("/user/categories");
        console.log("[Filters] API response:", data);

        // API trả về { success: true, data: [...] }
        const cats = Array.isArray(data?.data) ? data.data : [];
        setCategories(cats);

        console.log("[Filters] Set categories:", cats);
      } catch (err) {
        console.error("[Filters] Lỗi khi lấy categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // update filters state
  const handleChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;

    if (name === "isNew" && value !== "") {
      parsedValue = value === "true"; // convert string -> boolean
    }

    if ((name === "minPrice" || name === "maxPrice") && value !== "") {
      parsedValue = Number(value); // convert string -> number
    }

    console.log(`[Filters] Change filter: ${name} =`, parsedValue);

    onFilterChange({ ...filters, [name]: parsedValue });
  };

  // reset filter
  const handleReset = () => {
    const resetFilters = {
      q: "",
      isNew: "",
      brand: "",
      type: "",
      category: "",
      minPrice: "",
      maxPrice: "",
      sort: "newest",
    };

    console.log("[Filters] Reset filters ->", resetFilters);

    onFilterChange(resetFilters);
  };

  return (
    <div className="filters w-full flex flex-wrap items-center gap-2 p-3 border rounded-md mb-4 bg-white shadow-sm">
      {/* Search */}
      <input
        type="text"
        name="q"
        placeholder="🔍 Tìm kiếm sản phẩm"
        value={filters.q || ""}
        onChange={handleChange}
        className="border p-2 rounded flex-1 min-w-[200px]"
      />

      {/* Mới / Cũ */}
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
      </select>

      {/* Category */}
      <select
        name="category"
        value={filters.category || ""}
        onChange={handleChange}
        className="border p-2 rounded"
      >
        <option value="">Danh mục</option>
        {Array.isArray(categories) &&
          categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
      </select>

      {/* Price range */}
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

      {/* Sort */}
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

      {/* Reset button */}
      <button
        type="button"
        onClick={handleReset}
        className="ml-auto bg-gray-100 px-3 py-2 rounded border hover:bg-gray-200"
      >
        ❌ Reset
      </button>
    </div>
  );
};

export default Filters;
