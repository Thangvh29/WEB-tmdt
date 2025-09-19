// src/pages/admin/ProductAddPage.jsx
import React from 'react';
import ProductForm from '../../';
import { useNavigate } from 'react-router-dom';

const ProductAddPage = () => {
  const navigate = useNavigate();

  const handleSubmitSuccess = () => {
    navigate('/admin/products/list');
  };

  return (
    <div className="product-add-page">
      <h3>Thêm sản phẩm mới</h3>
      <ProductForm onSubmitSuccess={handleSubmitSuccess} />
    </div>
  );
};

export default ProductAddPage;