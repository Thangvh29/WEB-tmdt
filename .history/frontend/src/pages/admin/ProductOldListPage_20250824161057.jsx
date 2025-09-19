import React, { useState, useEffect } from 'react';
import api from '../../services/axios';
import ProductCard from '../../components/admin/Products/ProductCard';
import ProductFilter from '../../components/admin/Products/ProductFilter';
import ProductDetail from '../../components/admin/Products/ProductDetail';
import '../../assets/style/product-list.css';

const ProductOldListPage = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    name: '',
    brand: '',
    type: '',
    stockStatus: '',
    condition: ['like_new', 'good', 'fair', 'poor'], // Mặc định lọc sản phẩm cũ
  });

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setError('');
      // Lọc bỏ query rỗng, giữ condition như mảng
      const queryParams = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => {
          if (Array.isArray(value)) return value.length > 0;
          return value !== '';
        })
      );
      const { data } = await api.get('/admin/inventory', { params: queryParams });
      setProducts(data.products || []);
    } catch (err) {
      console.error('Lỗi tải danh sách sản phẩm cũ:', err);
      setError(err.response?.data?.message || 'Lỗi tải danh sách sản phẩm cũ');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Xác nhận xóa sản phẩm?')) {
      try {
        setError('');
        await api.delete(`/admin/products/${id}`);
        fetchProducts();
      } catch (err) {
        console.error('Lỗi xóa sản phẩm:', err);
        setError(err.response?.data?.message || 'Lỗi xóa sản phẩm');
      }
    }
  };

  const handleEdit = (id) => {
    setSelectedProduct(id);
  };

  return (
    <div className="product-old-list-page">
      <h3>Danh mục sản phẩm cũ</h3>
      {error && <p className="error-message">{error}</p>}
      <ProductFilter onFilter={(newFilters) => setFilters({ ...newFilters, condition: filters.condition })} />
      <div className="product-grid">
        {products.length > 0 ? (
          products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onViewDetail={() => setSelectedProduct(product._id)}
              onDelete={() => handleDelete(product._id)}
            />
          ))
        ) : (
          <p>Không có sản phẩm cũ nào</p>
        )}
      </div>
      {selectedProduct && (
        <ProductDetail
          productId={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onEdit={() => handleEdit(selectedProduct)}
        />
      )}
    </div>
  );
};

export default ProductOldListPage;