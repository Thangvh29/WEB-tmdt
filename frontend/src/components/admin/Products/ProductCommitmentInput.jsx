// src/components/admin/products/ProductCommitmentInput.jsx
import React from 'react';

const ProductCommitmentInput = ({ commitments, onChange }) => {
  const handleChange = (index, value) => {
    const updated = [...commitments];
    updated[index] = value;
    onChange(updated);
  };

  const addCommitment = () => {
    onChange([...commitments, '']);
  };

  const removeCommitment = (index) => {
    const updated = commitments.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="mb-3">
      <label className="form-label fw-bold">Cam kết</label>
      {commitments.map((commit, index) => (
        <div key={index} className="input-group mb-2">
          <input
            value={commit}
            onChange={(e) => handleChange(index, e.target.value)}
            className="form-control"
            placeholder="Nhập cam kết"
          />
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={() => removeCommitment(index)}
          >
            Xóa
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-outline-success btn-sm"
        onClick={addCommitment}
      >
        + Thêm cam kết
      </button>
    </div>
  );
};

export default ProductCommitmentInput;
