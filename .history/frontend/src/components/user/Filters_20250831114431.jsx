// frontend/src/components/user/Filters.jsx
import React from "react";
import api from "../../../services/axios";
const Filters = ({ filters, categories = [], onFilterChange }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;

    if (name === "isNew" && value !== "") {
      parsedValue = value === "true"; // convert về boolean
    }

    onFilterChange({ [name]: parsedValue });
  };

  return (
    <div className="filters flex flex-wrap gap-2 p-3 border rounded-md mb-4">
      <input
        type="text"
        name="q"
        placeholder="🔍 Tìm kiếm sản phẩm"
        value={filters.q || ""}
        onChange={handleChange}
        className="border p-2 rounded"
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
      <input
        type="text"
        name="brand"
        placeholder="Hãng"
        value={filters.brand || ""}
        onChange={handleChange}
        className="border p-2 rounded"
      />
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
      <select
        name="category"
        value={filters.category || ""}
        onChange={handleChange}
        className="border p-2 rounded"
      >
        <option value="">Danh mục</option>
        {categories.map((cat) => (
          <option key={cat._id} value={cat._id}>
            {cat.name}
          </option>
        ))}
      </select>
      <input
        type="number"
        name="minPrice"
        placeholder="Giá min"
        value={filters.minPrice || ""}
        onChange={handleChange}
        className="border p-2 rounded w-24"
      />
      <input
        type="number"
        name="maxPrice"
        placeholder="Giá max"
        value={filters.maxPrice || ""}
        onChange={handleChange}
        className="border p-2 rounded w-24"
      />
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
    </div>
  );
};

export default Filters;
