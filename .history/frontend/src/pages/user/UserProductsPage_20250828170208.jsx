// frontend/src/pages/user/UserProductsPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/axios';
import ProductCard from '../../components/user/ProductCard';
import Filters from '../../components/user/Filters';
import '../../assets/style/user-products.css'; // Giả sử có file CSS cho styling

const UserProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    q: '',
    isNew: undefined,
    brand: '',
    type: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    sort: 'newest',
    page: 1,
    limit: 12,
  });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      // Giả sử có endpoint /api/admin/categories/tree hoặc tương tự; backend có Category.getTree()
      // Nhưng cho user, có thể expose /api/user/categories
      // Tạm thời giả định fetch từ backend (cần thêm route nếu chưa có)
      const { data } = await api.get('/admin/categories'); // Adjust nếu cần
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (params.isNew !== undefined) params.isNew = params.isNew ? 'true' : 'false';
      const { data } = await api.get('/user/products', { params });
      setProducts(data.products || []);
      setTotal(data.total || 0); // Backend cần trả total cho pagination
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  return (
    <div className="user-products-page">
      <h1>Sản phẩm</h1>
      <Filters
        filters={filters}
        categories={categories}
        onFilterChange={handleFilterChange}
      />
      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
      {/* Pagination */}
      <div className="pagination">
        {Array.from({ length: Math.ceil(total / filters.limit) }, (_, i) => (
          <button
            key={i}
            onClick={() => handlePageChange(i + 1)}
            className={filters.page === i + 1 ? 'active' : ''}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default UserProductsPage;