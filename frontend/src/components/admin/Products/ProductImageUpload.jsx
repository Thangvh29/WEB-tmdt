import React, { useState } from 'react';
import api from '../../../services/axios'; // Đảm bảo import axios

const ProductImageUpload = ({ images = [], onChange }) => {
  const [preview, setPreview] = useState(images); // Lưu URLs từ server
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + preview.length > 10) return alert('Tối đa 10 ảnh');
    if (files.length === 0) return;

    setUploading(true);
    try {
      // Upload từng file và lấy URLs từ server
      const uploadPromises = files.map((file) => {
        const formData = new FormData();
        formData.append('image', file);
        
        return api.post('/admin/products/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }).then((res) => res.data.file.url);
      });
      
      const newUrls = await Promise.all(uploadPromises);

      // Cập nhật state với URLs mới
      const updatedImages = [...preview, ...newUrls];
      setPreview(updatedImages);
      onChange(updatedImages); // Truyền array URLs cho form
    } catch (err) {
      console.error('Upload error:', err);
      alert('Lỗi upload ảnh: ' + (err.response?.data?.message || 'Kiểm tra kết nối server'));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    const updated = preview.filter((_, i) => i !== index);
    setPreview(updated);
    onChange(updated); // Cập nhật form với URLs còn lại
  };

  return (
    <div>
      <input
        type="file"
        multiple
        accept="image/*"
        className="form-control mb-2"
        onChange={handleFileChange}
        disabled={uploading}
      />
      <div className="d-flex flex-wrap gap-2">
        {preview.map((img, i) => (
          <div key={i} className="position-relative">
            <img src={img} alt="" className="img-thumbnail" style={{ width: 100, height: 100, objectFit: 'cover' }} />
            <button
              type="button"
              className="btn btn-sm btn-danger position-absolute top-0 end-0"
              onClick={() => removeImage(i)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {uploading && <div className="text-muted">Đang upload...</div>}
    </div>
  );
};

export default ProductImageUpload;