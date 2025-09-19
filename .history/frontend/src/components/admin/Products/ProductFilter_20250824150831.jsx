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
    <form className="row g-2 align-items-end mb-4" onSubmit={handleSubmit}>
      <div className="col-md-3">
        <input
          className="form-control"
          name="name"
          value={filters.name}
          onChange={handleChange}
          placeholder="Tên sản phẩm"
        />
      </div>
      <div className="col-md-3">
        <input
          className="form-control"
          name="brand"
          value={filters.brand}
          onChange={handleChange}
          placeholder="Hãng"
        />
      </div>
      <div className="col-md-2">
        <select
          className="form-select"
          name="type"
          value={filters.type}
          onChange={handleChange}
        >
          <option value="">Loại</option>
          <option value="laptop">Laptop</option>
          <option value="card">Card đồ họa</option>
          <option value="monitor">Màn hình</option>
        </select>
      </div>
      <div className="col-md-2">
        <select
          className="form-select"
          name="stockStatus"
          value={filters.stockStatus}
          onChange={handleChange}
        >
          <option value="">Tồn kho</option>
          <option value="inStock">Còn hàng</option>
          <option value="outOfStock">Hết hàng</option>
        </select>
      </div>
      <div className="col-md-2">
        <button type="submit" className="btn btn-primary w-100">
          Lọc
        </button>
      </div>
    </form>
  );
};

export default ProductFilter;
