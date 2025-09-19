// src/pages/admin/ProductListPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/axios';
import ProductCard from '../../../components/admin/products/ProductCard';
import ProductFilter from '../../../components/admin/products/ProductFilter';
import ProductDetail from '../../components/admin/Products/';
import '../../assets/style/product-list.css'; // Giả sử có file CSS

const ProductListPage = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filters, setFilters] = useState({ name: '', brand: '', type: '', stockStatus: '' });

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/admin/inventory', { params: filters });
      setProducts(data.products || []);
    } catch (err) {
      console.error('Lỗi tải danh sách sản phẩm:', err);
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
    // Chuyển hướng đến trang chỉnh sửa (có thể tích hợp form chỉnh sửa trong modal)
    setSelectedProduct(id);
  };

  return (
    <div className="product-list-page">
      <h3>Danh mục sản phẩm</h3>
      <ProductFilter onFilter={setFilters} />
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

export default ProductListPage;