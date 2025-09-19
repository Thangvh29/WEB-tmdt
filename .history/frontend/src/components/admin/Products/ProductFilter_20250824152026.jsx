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
    <form className="row g-2 mb-4" onSubmit={handleSubmit}>
      <div className="col-sm-6 col-md-3">
        <input
          name="name"
          value={filters.name}
          onChange={handleChange}
          className="form-control"
          placeholder="Tên sản phẩm"
        />
      </div>
      <div className="col-sm-6 col-md-3">
        <input
          name="brand"
          value={filters.brand}
          onChange={handleChange}
          className="form-control"
          placeholder="Hãng"
        />
      </div>
      <div className="col-sm-6 col-md-3">
        <select
          name="type"
          value={filters.type}
          onChange={handleChange}
          className="form-select"
        >
          <option value="">Loại</option>
          <option value="laptop">Laptop</option>
          <option value="phone">Điện thoại</option>
        </select>
      </div>
      <div className="col-sm-6 col-md-2">
        <select
          name="stockStatus"
          value={filters.stockStatus}
          onChange={handleChange}
          className="form-select"
        >
          <option value="">Tồn kho</option>
          <option value="inStock">Còn hàng</option>
          <option value="outOfStock">Hết hàng</option>
        </select>
      </div>
      <div className="col-md-1 d-grid">
        <button type="submit" className="btn btn-primary">Lọc</button>
      </div>
    </form>
  );
};

export default ProductFilter;
