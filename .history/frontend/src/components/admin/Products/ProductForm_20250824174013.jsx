// src/components/admin/products/ProductForm.jsx
import React, { useState, useEffect } from 'react';
import api from '../../../services/axios';
import ProductSpecsInput from './ProductSpecsInput';
import ProductCommitmentInput from './ProductCommitmentInput';
import ProductImageUpload from './ProductImageUpload';

const ProductForm = ({ productId = null, onSubmitSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    type: 'laptop',
    images: [],
    price: 0,
    sellPrice: [],
    specifications: [],
    commitments: [],
    description: '',
    isNewProduct: true,
    stock: 0,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (productId) fetchProduct();
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
        sellPrice: data.variants || [],
        specifications: data.specs || [],
        commitments: data.commitments || [],
        description: data.description || '',
        isNewProduct: data.isNewProduct ?? true,
        stock: data.stock || 0,
      });
    } catch {
      setMessage('❌ Lỗi tải sản phẩm');
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "number" ? Number(value) : value }));
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...formData.sellPrice];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, sellPrice: updated }));
  };

  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      sellPrice: [...prev.sellPrice, { version: '', color: '', price: 0, stock: 0, images: [] }],
    }));
  };

  const removeVariant = (index) => {
    setFormData((prev) => ({
      ...prev,
      sellPrice: prev.sellPrice.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = productId ? `/admin/products/${productId}` : '/admin/products';
      const method = productId ? 'put' : 'post';
      const { data } = await api[method](endpoint, formData);
      setMessage('✅ Lưu sản phẩm thành công');
      onSubmitSuccess?.(data);
    } catch {
      setMessage('❌ Lỗi lưu sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="p-3 border rounded shadow-sm bg-light" onSubmit={handleSubmit}>
      <h4 className="mb-3">{productId ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</h4>

      <div className="mb-3">
        <label className="form-label">Tên sản phẩm</label>
        <input className="form-control" name="name" value={formData.name} onChange={handleChange} required />
      </div>

      <div className="mb-3">
        <label className="form-label">Hãng</label>
        <input className="form-control" name="brand" value={formData.brand} onChange={handleChange} required />
      </div>

      <div className="mb-3">
        <label className="form-label">Loại</label>
        <select className="form-select" name="type" value={formData.type} onChange={handleChange}>
          <option value="laptop">Laptop</option>
          <option value="gpu">GPU</option>
          <option value="monitor">Màn hình</option>
          <option value="CPU">CPU</option>
          <option value="Fan">Quạt</option>
          <option value="keyboard">Bàn phím</option>
          <option value="mouse">Chuột</option>
          <option value="mousepad">Lót chuột</option>
          <option value="headphone">Tai nghe</option>
          <option value="">Đèn</option>
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label">Ảnh sản phẩm</label>
        <ProductImageUpload images={formData.images} onChange={(imgs) => setFormData({ ...formData, images: imgs })} />
      </div>

      <div className="mb-3">
        <label className="form-label">Giá niêm yết</label>
        <input className="form-control" type="number" name="price" value={formData.price} onChange={handleChange} />
      </div>

      <div className="mb-3">
        <h5>Phiên bản / Màu sắc</h5>
        {formData.sellPrice.map((variant, index) => (
          <div key={index} className="border p-2 rounded mb-2 bg-white">
            <div className="row g-2">
              <div className="col-md-3">
                <input className="form-control" value={variant.version} onChange={(e) => handleVariantChange(index, 'version', e.target.value)} placeholder="Phiên bản" />
              </div>
              <div className="col-md-3">
                <input className="form-control" value={variant.color} onChange={(e) => handleVariantChange(index, 'color', e.target.value)} placeholder="Màu sắc" />
              </div>
              <div className="col-md-2">
                <input className="form-control" type="number" value={variant.price} onChange={(e) => handleVariantChange(index, 'price', e.target.value)} placeholder="Giá" />
              </div>
              <div className="col-md-2">
                <input className="form-control" type="number" value={variant.stock} onChange={(e) => handleVariantChange(index, 'stock', e.target.value)} placeholder="Kho" />
              </div>
              <div className="col-md-2 d-flex">
                <button type="button" className="btn btn-outline-danger w-100" onClick={() => removeVariant(index)}>Xóa</button>
              </div>
              <div className="col-12 mt-2">
                <ProductImageUpload images={variant.images} onChange={(imgs) => handleVariantChange(index, 'images', imgs)} />
              </div>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-outline-success btn-sm" onClick={addVariant}>+ Thêm phiên bản</button>
      </div>

      <ProductSpecsInput specs={formData.specifications} onChange={(specs) => setFormData({ ...formData, specifications: specs })} />
      <ProductCommitmentInput commitments={formData.commitments} onChange={(commits) => setFormData({ ...formData, commitments: commits })} />

      <div className="mb-3">
        <label className="form-label">Mô tả</label>
        <textarea className="form-control" name="description" rows="3" value={formData.description} onChange={handleChange} />
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Đang lưu..." : "Lưu sản phẩm"}
      </button>
      {message && <div className="alert alert-info mt-3">{message}</div>}
    </form>
  );
};

export default ProductForm;
