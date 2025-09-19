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
    <div>
      <h3>Cam kết</h3>
      {commitments.map((commit, index) => (
        <div key={index}>
          <input value={commit} onChange={(e) => handleChange(index, e.target.value)} placeholder="Cam kết" />
          <button type="button" onClick={() => removeCommitment(index)}>Xóa</button>
        </div>
      ))}
      <button type="button" onClick={addCommitment}>+</button>
    </div>
  );
};

export default ProductCommitmentInput;