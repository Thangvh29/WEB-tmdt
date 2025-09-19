import React from 'react';

const ProductSpecsInput = ({ specs, onChange }) => {
  const handleSpecChange = (index, field, value) => {
    const updated = [...specs];
    updated[index][field] = value;
    onChange(updated);
  };

  const addSpec = () => onChange([...specs, { key: '', value: '' }]);
  const removeSpec = (index) => onChange(specs.filter((_, i) => i !== index));

  return (
    <div className="mb-3">
      <h5>Thông số kỹ thuật</h5>
      {specs.map((spec, index) => (
        <div key={index} className="row g-2 mb-2">
          <div className="col-md-5">
            <input className="form-control" value={spec.key} onChange={(e) => handleSpecChange(index, 'key', e.target.value)} placeholder="Thuộc tính" />
          </div>
          <div className="col-md-5">
            <input className="form-control" value={spec.value} onChange={(e) => handleSpecChange(index, 'value', e.target.value)} placeholder="Giá trị" />
          </div>
          <div className="col-md-2">
            <button type="button" className="btn btn-outline-danger w-100" onClick={() => removeSpec(index)}>Xóa</button>
          </div>
        </div>
      ))}
      <button type="button" className="btn btn-outline-success btn-sm" onClick={addSpec}>+ Thêm thông số</button>
    </div>
  );
};

export default ProductSpecsInput;
