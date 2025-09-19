// src/pages/admin/ProductAddOldPage.jsx
import React from 'react';
import ProductForm from '../../components/admin/';
import { useNavigate } from 'react-router-dom';

const ProductAddOldPage = () => {
  const navigate = useNavigate();

  const handleSubmitSuccess = () => {
    navigate('/admin/products/old');
  };

  return (
    <div className="product-add-old-page">
      <h3>Thêm sản phẩm cũ</h3>
      <ProductForm onSubmitSuccess={handleSubmitSuccess} isOld={true} />
    </div>
  );
};

export default ProductAddOldPage;