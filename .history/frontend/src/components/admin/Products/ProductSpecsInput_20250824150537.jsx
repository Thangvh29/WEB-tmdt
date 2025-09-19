// src/components/admin/products/ProductSpecsInput.jsx
import React from 'react';

const ProductSpecsInput = ({ specs, onChange }) => {
  const handleSpecChange = (index, field, value) => {
    const updatedSpecs = [...specs];
    updatedSpecs[index][field] = value;
    onChange(updatedSpecs);
  };

  const addSpec = () => {
    onChange([...specs, { key: '', value: '' }]);
  };

  const removeSpec = (index) => {
    const updatedSpecs = specs.filter((_, i) => i !== index);
    onChange(updatedSpecs);
  };

  return (
    <div>
      <h3>Thông số kỹ thuật</h3>
      {specs.map((spec, index) => (
        <div key={index}>
          <input value={spec.key} onChange={(e) => handleSpecChange(index, 'key', e.target.value)} placeholder="Key" />
          <input value={spec.value} onChange={(e) => handleSpecChange(index, 'value', e.target.value)} placeholder="Value" />
          <button type="button" onClick={() => removeSpec(index)}>Xóa</button>
        </div>
      ))}
      <button type="button" onClick={addSpec}>+</button>
    </div>
  );
};

export default ProductSpecsInput;