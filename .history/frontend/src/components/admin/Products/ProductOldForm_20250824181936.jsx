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
    images: [],
    price: 0,
    sellPrice: [],
    specifications: [],
    commitments: [],
    description: '',
    condition: 'like_new',
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
        condition: data.condition || 'like_new',
        stock: data.stock || 0,
      });
    } catch {
      setMessage('❌ Lỗi tải sản phẩm cũ');
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
      const endpoint = productId ? `/admin/products/${productId}` : '/admin/products/old';
      const method = productId ? 'put' : 'post';
      const { data } = await api[method](endpoint, formData);
      setMessage('✅ Lưu sản phẩm cũ thành công');
      onSubmitSuccess?.(data);
    } catch {
      setMessage('❌ Lỗi lưu sản phẩm cũ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="p-3 border rounded shadow-sm bg-light" onSubmit={handleSubmit}>
      <h4 className="mb-3">{productId ? "Chỉnh sửa sản phẩm cũ" : "Thêm sản phẩm cũ"}</h4>

      {/* Tên sản phẩm */}
      <div className="mb-3">
        <label className="form-label">Tên sản phẩm</label>
        <input
          className="form-control"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="VD: Laptop Dell Latitude 7490"
          required
        />
        <small className="text-muted">Nhập tên sản phẩm đầy đủ và rõ ràng.</small>
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
        <small className="text-muted">Hãng sản xuất của sản phẩm.</small>
      </div>

      {/* Loại */}
      <div className="mb-3">
        <label className="form-label">Loại</label>
        <select className="form-select" name="type" value={formData.type} onChange={handleChange}>
          <option value="laptop">Laptop</option>
          <option value="gpu">GPU</option>
          <option value="monitor">Màn hình</option>
          <option value="CPU">CPU</option>
          <option value="mainboard">Mainboard</option>
          <option value="ram">RAM</option>
          <option value="storage">Ổ cứng</option>
          <option value="Fan">Quạt</option>
          <option value="keyboard">Bàn phím</option>
          <option value="mouse">Chuột</option>
          <option value="mousepad">Lót chuột</option>
          <option value="headphone">Tai nghe</option>
          <option value="light">Đèn</option>
          <option value="accessory">Phụ kiện</option>
        </select>
        <small className="text-muted">Chọn loại sản phẩm phù hợp.</small>
      </div>

      {/* Tình trạng */}
      <div className="mb-3">
        <label className="form-label">Tình trạng</label>
        <select className="form-select" name="condition" value={formData.condition} onChange={handleChange}>
          <option value="like_new">Như mới</option>
          <option value="good">Tốt</option>
          <option value="fair">Trung bình</option>
          <option value="poor">Kém</option>
        </select>
        <small className="text-muted">Chọn tình trạng hiện tại của sản phẩm cũ.</small>
      </div>

      {/* Ảnh sản phẩm */}
      <div className="mb-3">
        <label className="form-label">Ảnh sản phẩm</label>
        <ProductImageUpload
          images={formData.images}
          onChange={(imgs) => setFormData({ ...formData, images: imgs })}
        />
        <small className="text-muted">Tải ảnh đại diện và ảnh chi tiết sản phẩm.</small>
      </div>

      {/* Giá niêm yết */}
      <div className="mb-3">
        <label className="form-label">Giá niêm yết (VNĐ)</label>
        <input
          className="form-control"
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          placeholder="VD: 15,000,000"
        />
        <small className="text-muted">Nhập giá niêm yết chung cho sản phẩm (VNĐ).</small>
      </div>

      {/* Phiên bản / Màu sắc */}
      <div className="mb-3">
        <h5>Phiên bản / Màu sắc</h5>
        <small className="text-muted">Mỗi phiên bản có thể có giá và kho riêng. Ví dụ: "Core i5 / Đen".</small>
        {formData.sellPrice.map((variant, index) => (
          <div key={index} className="border p-2 rounded mb-2 bg-white">
            <div className="row g-2">
              <div className="col-md-3">
                <input
                  className="form-control"
                  value={variant.version}
                  onChange={(e) => handleVariantChange(index, 'version', e.target.value)}
                  placeholder="Phiên bản (VD: Core i5/8GB)"
                />
                <small className="text-muted">Thông tin phiên bản.</small>
              </div>
              <div className="col-md-3">
                <input
                  className="form-control"
                  value={variant.color}
                  onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                  placeholder="Màu sắc (VD: Đen, Bạc)"
                />
                <small className="text-muted">Màu sắc của phiên bản.</small>
              </div>
              <div className="col-md-2">
                <label className="form-label">Giá (VNĐ)</label>
                <input
                  className="form-control"
                  type="number"
                  value={variant.price}
                  onChange={(e) => handleVariantChange(index, 'price', Number(e.target.value))}
                  placeholder="VD: 14,500,000"
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Kho (số lượng)</label>
                <input
                  className="form-control"
                  type="number"
                  value={variant.stock}
                  onChange={(e) => handleVariantChange(index, 'stock', Number(e.target.value))}
                  placeholder="VD: 5"
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
                <small className="text-muted">Ảnh riêng cho phiên bản này (nếu có).</small>
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
        placeholder="VD: CPU: Intel Core i5, RAM: 8GB, SSD: 256GB"
      />

      {/* Cam kết */}
      <ProductCommitmentInput
        commitments={formData.commitments}
        onChange={(commits) => setFormData({ ...formData, commitments: commits })}
        placeholder="VD: Bảo hành 6 tháng, Bao test 7 ngày"
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
        <small className="text-muted">Nhập thông tin mô tả chi tiết sản phẩm cũ.</small>
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Đang lưu..." : "Lưu sản phẩm cũ"}
      </button>
      {message && <div className="alert alert-info mt-3">{message}</div>}
    </form>
  );
};

export default ProductOldForm;
