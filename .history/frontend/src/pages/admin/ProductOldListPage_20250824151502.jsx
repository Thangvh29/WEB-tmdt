// src/pages/admin/ProductOldListPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/axios';
import ProductCard from '../../components/admin/products/ProductCard';
import ProductFilter from '../../../components/admin/products/ProductFilter';
import ProductDetail from '../../../components/admin/products/ProductDetail';
import '../../assets/style/product-list.css'; // Tái sử dụng CSS từ ProductListPage

const ProductOldListPage = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filters, setFilters] = useState({ name: '', brand: '', type: '', stockStatus: '', condition: 'used' });

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/admin/inventory', { params: { ...filters, condition: ['like_new', 'good', 'fair', 'poor'] } });
      setProducts(data.products || []);
    } catch (err) {
      console.error('Lỗi tải danh sách sản phẩm cũ:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Xác nhận xóa sản phẩm?')) {
      try {
        await api.delete(`/admin/products/${id}`);
        fetchProducts();
      } catch (err) {
        console.error('Lỗi xóa sản phẩm:', err);
      }
    }
  };

  const handleEdit = (id) => {
    setSelectedProduct(id);
  };

  return (
    <div className="product-old-list-page">
      <h3>Danh mục sản phẩm cũ</h3>
      <ProductFilter onFilter={(newFilters) => setFilters({ ...newFilters, condition: 'used' })} />
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            onViewDetail={() => setSelectedProduct(product._id)}
            onDelete={() => handleDelete(product._id)}
          />
        ))}
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