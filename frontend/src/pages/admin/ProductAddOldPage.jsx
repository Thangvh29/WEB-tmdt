// src/pages/admin/ProductAddOldPage.jsx
import React from 'react';
import ProductOldForm from '../../components/admin/Products/ProductOldForm';
import { useNavigate } from 'react-router-dom';

const ProductAddOldPage = () => {
  const navigate = useNavigate();

  const handleSubmitSuccess = () => {
    // Sau khi thêm thành công, chuyển về danh sách sản phẩm cũ
    navigate('/admin/products/old');
  };

  return (
    <div className="product-add-old-page">
      <h3>Thêm sản phẩm cũ</h3>
      <ProductOldForm onSubmitSuccess={handleSubmitSuccess} />
    </div>
  );
};

export default ProductAddOldPage;
