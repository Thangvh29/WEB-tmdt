import React, { useState } from 'react';

const ProductImageUpload = ({ images = [], onChange }) => {
  const [preview, setPreview] = useState(images);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + preview.length > 10) return alert('Tối đa 10 ảnh');
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreview([...preview, ...newPreviews]);
    onChange([...images, ...files]);
  };

  const removeImage = (index) => {
    const updated = preview.filter((_, i) => i !== index);
    setPreview(updated);
    onChange(updated);
  };

  return (
    <div>
      <input type="file" multiple accept="image/*" className="form-control mb-2" onChange={handleFileChange} />
      <div className="d-flex flex-wrap gap-2">
        {preview.map((img, i) => (
          <div key={i} className="position-relative">
            <img src={img} alt="" className="img-thumbnail" style={{ width: 100, height: 100, objectFit: "cover" }} />
            <button type="button" className="btn btn-sm btn-danger position-absolute top-0 end-0" onClick={() => removeImage(i)}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductImageUpload;
