import React, { useState, useEffect } from 'react';
import api from '../../../services/axios';
import ProductSpecsInput from './ProductSpecsInput';
import ProductCommitmentInput from './ProductCommitmentInput';
import ProductImageUpload from './ProductImageUpload';

const ProductOldForm = ({ productId = null, onSubmitSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    type: 'laptop',
    category: '',          // 👈 bắt buộc
    images: [],
    price: 0,
    variants: [],
    specs: [],
    commitments: [],
    description: '',
    condition: 'like_new',
    stock: 0,
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    fetchCategories();
    if (productId) fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/admin/categories/');
      setCategories(data);
    } catch (err) {
      console.error('Lỗi tải categories:', err);
      setMessage('⚠️ Lỗi tải danh mục');
      setCategories([]);
    }
  };

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/admin/products/${productId}`);
      setFormData({
        name: data.name || '',
        brand: data.brand || '',
        type: data.type || 'laptop',
        category: data.category?._id || '',
        images: data.images || [],
        price: data.price || 0,
        variants: Array.isArray(data.variants) ? data.variants.map(v => ({
          attributes: [
            { name: 'version', value: v.attributes?.find(a => a.name === 'version')?.value || '' },
            { name: 'color', value: v.attributes?.find(a => a.name === 'color')?.value || '' },
          ],
          price: Number(v.price) || 0,
          stock: Number(v.stock) || 0,
          images: v.images || [],
        })) : [],
        specs: Array.isArray(data.specs) ? data.specs.map(s => ({ key: s.key, value: s.value })) : [],
        commitments: data.commitments || [],
        description: data.description || '',
        condition: data.condition || 'like_new',
        stock: Number(data.stock) || 0,
      });
    } catch (err) {
      console.error('Lỗi tải sản phẩm cũ:', err);
      setMessage('⚠️ Lỗi tải sản phẩm cũ');
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...formData.variants];
    if (field === 'version' || field === 'color') {
      const attrIdx = updated[index].attributes.findIndex(a => a.name === field);
      if (attrIdx >= 0) updated[index].attributes[attrIdx].value = value;
      else updated[index].attributes.push({ name: field, value });
    } else {
      updated[index][field] = value;
    }
    setFormData(prev => ({ ...prev, variants: updated }));
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          attributes: [
            { name: 'version', value: '' },
            { name: 'color', value: '' },
          ],
          price: 0,
          stock: 0,
          images: [],
        }
      ]
    }));
  };

  const removeVariant = (index) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const normalizeFormData = (raw) => ({
    name: raw.name?.trim(),
    brand: raw.brand?.trim(),
    type: raw.type,
    category: raw.category || '',
    images: Array.isArray(raw.images) ? raw.images : [],
    price: Number(raw.price) || 0,
    variants: (raw.variants || []).map(v => ({
      attributes: [
        { name: 'version', value: v.attributes?.find(a => a.name === 'version')?.value || '' },
        { name: 'color', value: v.attributes?.find(a => a.name === 'color')?.value || '' },
      ],
      price: Number(v.price) || 0,
      stock: Number(v.stock) || 0,
      images: Array.isArray(v.images) ? v.images : [],
    })),
    specs: (raw.specs || []).map(s => ({ key: s.key, value: s.value })),
    commitments: raw.commitments || [],
    description: raw.description || '',
    condition: raw.condition || 'like_new',
    stock: (raw.variants?.length ?? 0) === 0 ? Number(raw.stock) || 0 : undefined,
    isNewProduct: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    setMessage('');

    if (!formData.category) {
      setMessage('⚠️ Vui lòng chọn danh mục');
      setLoading(false);
      return;
    }
    if (!formData.images || formData.images.length === 0) {
      setMessage('⚠️ Vui lòng upload ít nhất 1 ảnh sản phẩm.');
      setLoading(false);
      return;
    }

    try {
      const endpoint = productId ? `/admin/products/${productId}` : '/admin/products/old';
      const method = productId ? 'put' : 'post';
      const payload = normalizeFormData(formData);
      const { data } = await api[method](endpoint, payload);

      setMessage('✅ Lưu sản phẩm cũ thành công');
      onSubmitSuccess?.(data);
    } catch (err) {
      console.error('Lỗi lưu sản phẩm cũ:', err);
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setMessage('⚠️ ' + (err.response?.data?.message || 'Lỗi không xác định'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="p-3 border rounded shadow-sm bg-light" onSubmit={handleSubmit}>
      <h4 className="mb-3">{productId ? 'Chỉnh sửa sản phẩm cũ' : 'Thêm sản phẩm cũ'}</h4>

      {/* Error list */}
      {errors.length > 0 && (
        <div className="alert alert-danger">
          <ul className="mb-0">
            {errors.map((error, index) => (
              <li key={index}>{error.msg || error.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Tên sản phẩm */}
      <div className="mb-3">
        <label className="form-label">Tên sản phẩm *</label>
        <input
          className="form-control"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="VD: Laptop Dell Latitude 7490"
          required
        />
      </div>

      {/* Hãng */}
      <div className="mb-3">
        <label className="form-label">Hãng *</label>
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
        <label className="form-label">Loại *</label>
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
        <label className="form-label">Danh mục *</label>
        <select
          className="form-select"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
        >
          <option value="">Chọn danh mục</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tình trạng */}
      <div className="mb-3">
        <label className="form-label">Tình trạng *</label>
        <select className="form-select" name="condition" value={formData.condition} onChange={handleChange}>
          <option value="like_new">Như mới</option>
          <option value="good">Tốt</option>
          <option value="fair">Trung bình</option>
          <option value="poor">Kém</option>
        </select>
      </div>

      {/* Ảnh sản phẩm */}
      <div className="mb-3">
        <label className="form-label">Ảnh sản phẩm *</label>
        <ProductImageUpload
          images={formData.images}
          onChange={(imgs) => setFormData({ ...formData, images: imgs })}
        />
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
          min="0"
        />
      </div>

      {/* Variants */}
      <div className="mb-3">
        <h5>Phiên bản / Màu sắc</h5>
        {formData.variants.map((variant, index) => (
          <div key={index} className="border p-2 rounded mb-2 bg-white">
            <div className="row g-2">
              <div className="col-md-3">
                <input
                  className="form-control"
                  value={variant.attributes?.find(a => a.name === 'version')?.value || ''}
                  onChange={(e) => handleVariantChange(index, 'version', e.target.value)}
                  placeholder="Phiên bản (VD: Core i5/8GB)"
                />
              </div>
              <div className="col-md-3">
                <input
                  className="form-control"
                  value={variant.attributes?.find(a => a.name === 'color')?.value || ''}
                  onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                  placeholder="Màu sắc (VD: Đen)"
                />
              </div>
              <div className="col-md-2">
                <input
                  className="form-control"
                  type="number"
                  value={variant.price}
                  onChange={(e) => handleVariantChange(index, 'price', Number(e.target.value))}
                  placeholder="Giá"
                  min="0"
                />
              </div>
              <div className="col-md-2">
                <input
                  className="form-control"
                  type="number"
                  value={variant.stock}
                  onChange={(e) => handleVariantChange(index, 'stock', Number(e.target.value))}
                  placeholder="Kho"
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
        <button type="button" className="btn btn-outline-success btn-sm" onClick={addVariant}>
          + Thêm phiên bản
        </button>
      </div>

      {/* Thông số kỹ thuật */}
      <ProductSpecsInput
        specs={formData.specs}
        onChange={(specs) => setFormData({ ...formData, specs })}
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
          placeholder="Mô tả chi tiết về tình trạng, tính năng của sản phẩm"
        />
      </div>

      {/* Stock tổng */}
      {formData.variants.length === 0 && (
        <div className="mb-3">
          <label className="form-label">Số lượng tồn kho</label>
          <input
            className="form-control"
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            min="0"
          />
        </div>
      )}

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Đang lưu...' : 'Lưu sản phẩm cũ'}
      </button>

      {message && (
        <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-warning'} mt-3`}>
          {message}
        </div>
      )}
    </form>
  );
};

export default ProductOldForm;
