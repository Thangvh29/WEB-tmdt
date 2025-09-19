import type React, { useEffect, useState } from "react";
import PropTypes from "prop-types";

const Filters = ({ filtersData, onFilterChange }) => {
  const [selectedFilters, setSelectedFilters] = useState({
    category: "",
    brand: "",
    priceRange: "",
  });

  // Cập nhật filter khi user chọn
  const handleChange = (key, value) => {
    const updatedFilters = { ...selectedFilters, [key]: value };
    setSelectedFilters(updatedFilters);
    onFilterChange(updatedFilters); // Gửi filter về Products.jsx
  };

  return (
    <div className="filters">
      <h3>Bộ lọc</h3>

      {/* Lọc theo danh mục */}
      {filtersData.categories && (
        <div className="filter-group">
          <label htmlFor="category">Danh mục:</label>
          <select
            id="category"
            value={selectedFilters.category}
            onChange={(e) => handleChange("category", e.target.value)}
          >
            <option value="">-- Tất cả --</option>
            {filtersData.categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Lọc theo thương hiệu */}
      {filtersData.brands && (
        <div className="filter-group">
          <label htmlFor="brand">Thương hiệu:</label>
          <select
            id="brand"
            value={selectedFilters.brand}
            onChange={(e) => handleChange("brand", e.target.value)}
          >
            <option value="">-- Tất cả --</option>
            {filtersData.brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Lọc theo giá */}
      {filtersData.priceRanges && (
        <div className="filter-group">
          <label htmlFor="priceRange">Khoảng giá:</label>
          <select
            id="priceRange"
            value={selectedFilters.priceRange}
            onChange={(e) => handleChange("priceRange", e.target.value)}
          >
            <option value="">-- Tất cả --</option>
            {filtersData.priceRanges.map((range, idx) => (
              <option key={idx} value={range}>
                {range}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

Filters.propTypes = {
  filtersData: PropTypes.shape({
    categories: PropTypes.array,
    brands: PropTypes.array,
    priceRanges: PropTypes.array,
  }).isRequired,
  onFilterChange: PropTypes.func.isRequired,
};

export default Filters;
