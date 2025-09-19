// src/components/admin/products/ProductImageUpload.jsx
import React, { useState } from 'react';

const ProductImageUpload = ({ images, onChange }) => {
  const [preview, setPreview] = useState(images);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + preview.length > 10) return alert('Tối đa 10 ảnh');
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreview([...preview, ...newPreviews]);
    onChange([...images, ...files]); // Gửi files lên backend
  };

  const removeImage = (index) => {
    const updated = preview.filter((_, i) => i !== index);
    setPreview(updated);
    onChange(updated);
  };

  return (
    <div>
      <input type="file" multiple accept="image/*" onChange={handleFileChange} />
      <div>
        {preview.map((img, i) => (
          <div key={i}>
            <img src={img} alt="" width="100" />
            <button onClick={() => removeImage(i)}>Xóa</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductImageUpload;