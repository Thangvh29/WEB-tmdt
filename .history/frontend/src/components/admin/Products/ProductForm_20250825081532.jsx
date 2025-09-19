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
    category: '',
    images: [],
    price: 0,
    variants: [],   // đổi từ sellPrice -> variants cho khớp BE
    specs: [],      // đổi từ specifications -> specs cho khớp BE
    commitments: [],
    description: '',
    isNewProduct: true,
    stock: 0,
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState([]);

  // Fetch categories và product khi component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('api/admin/categories');
        setCategories(data);
      } catch (err) {
        console.error('Lỗi tải categories:', err);
        setMessage('⚠️ Lỗi tải danh mục, vui lòng thêm danh mục thủ công hoặc kiểm tra server');
        setCategories([]);
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
        category: data.category?._id || '',
        images: data.images || [],
        price: data.price || 0,
        variants: data.variants || [],
        specs: data.specs || [],
        commitments: data.commitments || [],
        description: data.description || '',
        isNewProduct: data.isNewProduct ?? true,
        stock: data.stock || 0,
      });
    } catch (err) {
      console.error('Lỗi tải sản phẩm:', err);
      setMessage('⚠️ Lỗi tải sản phẩm');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'number' ? Number(value) : type === 'checkbox' ? checked : value 
    }));
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...formData.variants];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, variants: updated }));
  };

  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, { 
        attributes: [
          { name: "version", value: "" },
          { name: "color", value: "" }
        ],
        price: 0, stock: 0, images: [] 
      }],
    }));
  };

  const removeVariant = (index) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  // Chuẩn hóa dữ liệu từ FE sang đúng BE format
  const normalizeFormData = (formData) => {
    return {
      ...formData,
      specs: formData.specs.map(s => ({ key: s.key, value: s.value })), // BE yêu cầu key/value
      variants: formData.variants.map(v => ({
        ...v,
        attributes: [
          { name: "version", value: v.attributes?.find(a => a.name === "version")?.value || "" },
          { name: "color", value: v.attributes?.find(a => a.name === "color")?.value || "" }
        ],
        price: Number(v.price) || 0,
        stock: Number(v.stock) || 0,
        images: v.images || []  // BE yêu cầu string[] (URL)
      })),
      images: formData.images || [] // ảnh sản phẩm chính
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    setMessage('');

    if (!formData.category || formData.category === '') {
      setMessage('⚠️ Vui lòng chọn danh mục trước khi lưu');
      setLoading(false);
      return;
    }
    if (!formData.images || formData.images.length === 0) {
      setMessage('⚠️ Vui lòng upload ít nhất 1 ảnh');
      setLoading(false);
      return;
    }

    try {
      const endpoint = productId ? `/admin/products/${productId}` : '/admin/products';
      const method = productId ? 'put' : 'post';

      const payload = normalizeFormData(formData);
      const { data } = await api[method](endpoint, payload);

      setMessage('✅ Lưu sản phẩm thành công');
      onSubmitSuccess?.(data);
    } catch (err) {
      console.error('Lỗi lưu sản phẩm:', err);
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else if (err.response?.data?.details) {
        setErrors(err.response.data.details);
      } else {
        setMessage('⚠️ Lỗi lưu sản phẩm: ' + (err.response?.data?.message || 'Lỗi không xác định'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="p-3 border rounded shadow-sm bg-light" onSubmit={handleSubmit}>
      <h4 className="mb-3">{productId ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h4>

      {/* lỗi validation */}
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
          placeholder="VD: Laptop Dell Inspiron 16"
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
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
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

      {/* Checkbox sản phẩm mới/cũ */}
      <div className="mb-3">
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            name="isNewProduct"
            id="isNewProduct"
            checked={formData.isNewProduct}
            onChange={handleChange}
          />
          <label className="form-check-label" htmlFor="isNewProduct">
            Sản phẩm mới
          </label>
        </div>
      </div>

      {/* Giá niêm yết */}
      <div className="mb-3">
        <label className="form-label">Giá niêm yết *</label>
        <input
          className="form-control"
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          min="1"
          required
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
                  value={variant.attributes?.find(a => a.name === "version")?.value || ""}
                  onChange={(e) => {
                    const updated = [...formData.variants];
                    const attr = updated[index].attributes.find(a => a.name === "version");
                    if (attr) attr.value = e.target.value;
                    else updated[index].attributes.push({ name: "version", value: e.target.value });
                    setFormData({ ...formData, variants: updated });
                  }}
                  placeholder="Phiên bản (VD: Pro 2023)"
                />
              </div>
              <div className="col-md-3">
                <input
                  className="form-control"
                  value={variant.attributes?.find(a => a.name === "color")?.value || ""}
                  onChange={(e) => {
                    const updated = [...formData.variants];
                    const attr = updated[index].attributes.find(a => a.name === "color");
                    if (attr) attr.value = e.target.value;
                    else updated[index].attributes.push({ name: "color", value: e.target.value });
                    setFormData({ ...formData, variants: updated });
                  }}
                  placeholder="Màu sắc (VD: Bạc)"
                />
              </div>
              <div className="col-md-2">
                <input
                  className="form-control"
                  type="number"
                  value={variant.price}
                  onChange={(e) => handleVariantChange(index, 'price', Number(e.target.value))}
                  min="1"
                />
              </div>
              <div className="col-md-2">
                <input
                  className="form-control"
                  type="number"
                  value={variant.stock}
                  onChange={(e) => handleVariantChange(index, 'stock', Number(e.target.value))}
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
          rows="4"
          value={formData.description}
          onChange={handleChange}
        />
      </div>

      {/* Stock (nếu không có variants) */}
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
        {loading ? 'Đang lưu...' : 'Lưu sản phẩm'}
      </button>
      
      {message && (
        <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-warning'} mt-3`}>
          {message}
        </div>
      )}
    </form>
  );
};

export default ProductForm;
