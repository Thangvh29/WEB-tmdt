// src/components/admin/products/ProductFilter.jsx
import React, { useState } from 'react';

const ProductFilter = ({ onFilter }) => {
  const [filters, setFilters] = useState({
    name: '',
    brand: '',
    type: '',
    stockStatus: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter(filters);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" value={filters.name} onChange={handleChange} placeholder="Tên" />
      <input name="brand" value={filters.brand} onChange={handleChange} placeholder="Hãng" />
      <select name="type" value={filters.type} onChange={handleChange}>
        <option value="">Loại</option>
        <option value="laptop">Laptop</option>
        {/* Thêm các loại */}
      </select>
      <select name="stockStatus" value={filters.stockStatus} onChange={handleChange}>
        <option value="">Tồn kho</option>
        <option value="inStock">Còn hàng</option>
        <option value="outOfStock">Hết hàng</option>
      </select>
      <button type="submit">Lọc</button>
    </form>
  );
};

export default ProductFilter;