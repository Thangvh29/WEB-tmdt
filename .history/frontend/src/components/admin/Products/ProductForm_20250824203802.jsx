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
    category: '', // Thêm category
    images: [],   // Array URLs
    price: 0,
    sellPrice: [],
    specifications: [],
    commitments: [],
    description: '',
    isNewProduct: true,
    stock: 0,
  });
  const [categories, setCategories] = useState([]); // Danh sách category
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch categories khi component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/api/categories'); // Giả sử endpoint này tồn tại
        setCategories(data);
      } catch (err) {
        setMessage('❌ Lỗi tải danh mục');
      }
    };
    fetchCategories();
    if (productId) fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/admin/products/${productId}`);
      setFormData({
        name: data.name || '',
        brand: data.brand || '',
        type: data.type || 'laptop',
        category: data.category?._id || '', // Set category ID
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
    setFormData((prev) => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
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
      const { data } = await api[method](endpoint, formData); // Submit JSON với URLs
      setMessage('✅ Lưu sản phẩm thành công');
      onSubmitSuccess?.(data);
    } catch (err) {
      setMessage('❌ Lỗi lưu sản phẩm: ' + (err.response?.data?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="p-3 border rounded shadow-sm bg-light" onSubmit={handleSubmit}>
      <h4 className="mb-3">{productId ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h4>

      {/* Tên sản phẩm */}
      <div className="mb-3">
        <label className="form-label">Tên sản phẩm</label>
        <input
          className="form-control"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="VD: Laptop Dell Inspiron 16"
          required
        />
      </div>

      {/* Hãng */}
      <div className="mb-3">
        <label className="form-label">Hãng</label>
        <input
          className="form-control"
          name="brand"
          value={formData.brand}
          onChange={handleChange}
          placeholder="VD: Dell, Asus, MSI"
          required
        />
      </div>

      {/* Loại */}
      <div className="mb-3">
        <label className="form-label">Loại</label>
        <select className="form-select" name="type" value={formData.type} onChange={handleChange}>
          <option value="laptop">Laptop</option>
          <option value="gpu">GPU</option>
          <option value="monitor">Màn hình</option>
          <option value="cpu">CPU</option>
          <option value="mainboard">Mainboard</option>
          <option value="ram">RAM</option>
          <option value="storage">Ổ cứng</option>
          <option value="fan">Quạt</option>
          <option value="keyboard">Bàn phím</option>
          <option value="mouse">Chuột</option>
          <option value="mousepad">Lót chuột</option>
          <option value="headphone">Tai nghe</option>
          <option value="light">Đèn</option>
          <option value="accessory">Phụ kiện</option>
        </select>
      </div>

      {/* Danh mục */}
      <div className="mb-3">
        <label className="form-label">Danh mục</label>
        <select
          className="form-select"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
        >
          <option value="">Chọn danh mục</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Ảnh sản phẩm */}
      <div className="mb-3">
        <label className="form-label">Ảnh sản phẩm</label>
        <ProductImageUpload
          images={formData.images}
          onChange={(imgs) => setFormData({ ...formData, images: imgs })} // imgs phải là array URLs
        />
        <small className="text-muted">Tải ít nhất 3 ảnh (URL sau khi upload).</small>
      </div>

      {/* Giá niêm yết */}
      <div className="mb-3">
        <label className="form-label">Giá niêm yết</label>
        <input
          className="form-control"
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          placeholder="VD: 45000000"
          min="1"
          required
        />
      </div>

      {/* Phiên bản / Màu sắc */}
      <div className="mb-3">
        <h5>Phiên bản / Màu sắc</h5>
        {formData.sellPrice.map((variant, index) => (
          <div key={index} className="border p-2 rounded mb-2 bg-white">
            <div className="row g-2">
              <div className="col-md-3">
                <input
                  className="form-control"
                  value={variant.version}
                  onChange={(e) => handleVariantChange(index, 'version', e.target.value)}
                  placeholder="Phiên bản (VD: Pro 2023)"
                />
              </div>
              <div className="col-md-3">
                <input
                  className="form-control"
                  value={variant.color}
                  onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                  placeholder="Màu sắc (VD: Bạc)"
                />
              </div>
              <div className="col-md-2">
                <input
                  className="form-control"
                  type="number"
                  value={variant.price}
                  onChange={(e) => handleVariantChange(index, 'price', Number(e.target.value))}
                  placeholder="VD: 45,000,000"
                  min="1"
                />
              </div>
              <div className="col-md-2">
                <input
                  className="form-control"
                  type="number"
                  value={variant.stock}
                  onChange={(e) => handleVariantChange(index, 'stock', Number(e.target.value))}
                  placeholder="VD: 10"
                  min="0"
                />
              </div>
              <div className="col-md-2 d-flex">
                <button type="button" className="btn btn-outline-danger w-100" onClick={() => removeVariant(index)}>Xóa</button>
              </div>
              <div className="col-12 mt-2">
                <ProductImageUpload
                  images={variant.images}
                  onChange={(imgs) => handleVariantChange(index, 'images', imgs)}
                />
              </div>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-outline-success btn-sm" onClick={addVariant}>+ Thêm phiên bản</button>
      </div>

      {/* Thông số kỹ thuật */}
      <ProductSpecsInput
        specs={formData.specifications}
        onChange={(specs) => setFormData({ ...formData, specifications: specs })}
      />

      {/* Cam kết */}
      <ProductCommitmentInput
        commitments={formData.commitments}
        onChange={(commits) => setFormData({ ...formData, commitments: commits })}
      />

      {/* Mô tả */}
      <div className="mb-3">
        <label className="form-label">Mô tả</label>
        <textarea
          className="form-control"
          name="description"
          rows="3"
          value={formData.description}
          onChange={handleChange}
          placeholder="Mô tả tổng quan, tính năng nổi bật"
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Đang lưu...' : 'Lưu sản phẩm'}
      </button>
      {message && <div className="alert alert-info mt-3">{message}</div>}
    </form>
  );
};

export default ProductForm;