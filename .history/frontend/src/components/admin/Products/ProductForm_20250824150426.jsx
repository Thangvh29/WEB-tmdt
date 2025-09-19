// src/components/admin/products/ProductForm.jsx
import React, { useState, useEffect } from 'react';
import api from '../../../services/axios'; // Giả sử đường dẫn đúng
import ProductSpecsInput from './ProductSpecsInput';
import ProductCommitmentInput from './ProductCommitmentInput';
import ProductImageUpload from './ProductImageUpload';

const ProductForm = ({ productId = null, onSubmitSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    type: 'laptop', // Default
    images: [],
    price: 0,
    sellPrice: [], // Variants
    specifications: [],
    commitments: [],
    description: '',
    isNewProduct: true,
    stock: 0,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/admin/products/${productId}`);
      setFormData({
        name: data.name || '',
        brand: data.brand || '',
        type: data.type || 'laptop',
        images: data.images || [],
        price: data.price || 0,
        sellPrice: data.variants || [], // Map variants to sellPrice
        specifications: data.specs || [],
        commitments: data.commitments || [],
        description: data.description || '',
        isNewProduct: data.isNewProduct || true,
        stock: data.stock || 0,
      });
    } catch (err) {
      setMessage('Lỗi tải sản phẩm');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...formData.sellPrice];
    updatedVariants[index][field] = value;
    setFormData((prev) => ({ ...prev, sellPrice: updatedVariants }));
  };

  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      sellPrice: [...prev.sellPrice, { version: '', color: '', price: 0, stock: 0, images: [] }],
    }));
  };

  const removeVariant = (index) => {
    const updatedVariants = formData.sellPrice.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, sellPrice: updatedVariants }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = productId ? `/admin/products/${productId}` : '/admin/products';
      const method = productId ? 'put' : 'post';
      const { data } = await api[method](endpoint, formData);
      setMessage('Thành công');
      if (onSubmitSuccess) onSubmitSuccess(data);
    } catch (err) {
      setMessage('Lỗi lưu sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" value={formData.name} onChange={handleChange} placeholder="Tên sản phẩm" required />
      <input name="brand" value={formData.brand} onChange={handleChange} placeholder="Hãng" required />
      <select name="type" value={formData.type} onChange={handleChange}>
        <option value="laptop">Laptop</option>
        <option value="gpu">GPU</option>
        <option value="monitor">Màn hình</option>
        {/* Thêm các loại khác từ enum */}
      </select>
      <ProductImageUpload images={formData.images} onChange={(imgs) => setFormData({ ...formData, images: imgs })} />
      <input name="price" type="number" value={formData.price} onChange={handleChange} placeholder="Giá niêm yết" />
      <div>
        <h3>Phiên bản / Màu sắc</h3>
        {formData.sellPrice.map((variant, index) => (
          <div key={index}>
            <input
              value={variant.version}
              onChange={(e) => handleVariantChange(index, 'version', e.target.value)}
              placeholder="Phiên bản"
            />
            <input
              value={variant.color}
              onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
              placeholder="Màu sắc"
            />
            <input
              type="number"
              value={variant.price}
              onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
              placeholder="Giá bán"
            />
            <input
              type="number"
              value={variant.stock}
              onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
              placeholder="Tồn kho"
            />
            <ProductImageUpload
              images={variant.images}
              onChange={(imgs) => handleVariantChange(index, 'images', imgs)}
            />
            <button type="button" onClick={() => removeVariant(index)}>Xóa</button>
          </div>
        ))}
        <button type="button" onClick={addVariant}>Thêm phiên bản</button>
      </div>
      <ProductSpecsInput specs={formData.specifications} onChange={(specs) => setFormData({ ...formData, specifications: specs })} />
      <ProductCommitmentInput commitments={formData.commitments} onChange={(commits) => setFormData({ ...formData, commitments: commits })} />
      <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Mô tả" />
      <button type="submit" disabled={loading}>Lưu</button>
      {message && <p>{message}</p>}
    </form>
  );
};

export default ProductForm;