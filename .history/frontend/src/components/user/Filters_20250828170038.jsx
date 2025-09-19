// frontend/src/components/user/Filters.jsx
import React from 'react';

const Filters = ({ filters, categories, onFilterChange }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ [name]: value });
  };

  return (
    <div className="filters">
      <input
        type="text"
        name="q"
        placeholder="Tìm kiếm tên sản phẩm"
        value={filters.q}
        onChange={handleChange}
      />
      <select name="isNew" value={filters.isNew} onChange={handleChange}>
        <option value="">Mới/Cũ</option>
        <option value={true}>Mới</option>
        <option value={false}>Cũ</option>
      </select>
      <input type="text" name="brand" placeholder="Hãng" value={filters.brand} onChange={handleChange} />
      <select name="type" value={filters.type} onChange={handleChange}>
        <option value="">Loại</option>
        {/* Từ enum trong model */}
        <option value="laptop">Laptop</option>
        <option value="gpu">GPU</option>
        {/* Thêm các loại khác */}
      </select>
      <select name="category" value={filters.category} onChange={handleChange}>
        <option value="">Danh mục</option>
        {categories.map(cat => (
          <option key={cat._id} value={cat._id}>{cat.name}</option>
        ))}
      </select>
      <input type="number" name="minPrice" placeholder="Giá min" value={filters.minPrice} onChange={handleChange} />
      <input type="number" name="maxPrice" placeholder="Giá max" value={filters.maxPrice} onChange={handleChange} />
      <select name="sort" value={filters.sort} onChange={handleChange}>
        <option value="newest">Mới nhất</option>
        <option value="priceAsc">Giá tăng</option>
        <option value="priceDesc">Giá giảm</option>
        <option value="popular">Phổ biến</option>
      </select>
      {/* Bộ lọc nâng cao: có thể thêm modal với specs, etc. */}
    </div>
  );
};

export default Filters;