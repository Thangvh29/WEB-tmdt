// src/components/admin/ProductInventoryCard.jsx
import { useState } from 'react';
import api from '../../services/axios';

const ProductInventoryCard = ({ product, onUpdate }) => {
  const [stock, setStock] = useState(product.stock);
  const [variantId, setVariantId] = useState(''); // Nếu có variants
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await api.patch(`/admin/inventory/${product._id}/stock`, {
        stock: Number(stock),
        variantId: variantId || undefined, // Nếu update variant
      });
      alert('Cập nhật thành công');
      onUpdate(); // Refresh list
    } catch (err) {
      alert('Lỗi cập nhật: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="product-card"> {/* Style: border, padding, etc. */}
      <img src={product.image || '/default-image.png'} alt={product.name} width="150" />
      <h3>{product.name}</h3>
      <p>Thương hiệu: {product.brand}</p>
      <p>Loại: {product.type}</p>
      <p>Trạng thái: {product.status === 'inStock' ? 'Còn hàng' : 'Hết hàng'}</p>
      <p>Tồn kho hiện tại: {product.stock}</p>

      {/* Nếu có variants */}
      {product.variants?.length > 0 && (
        <select onChange={(e) => setVariantId(e.target.value)}>
          <option value="">Update toàn bộ</option>
          {product.variants.map((v) => (
            <option key={v._id} value={v._id}>Biến thể {v.attributes?.map(a => `${a.name}: ${a.value}`).join(', ')} (Stock: {v.stock})</option>
          ))}
        </select>
      )}

      <input
        type="number"
        value={stock}
        onChange={(e) => setStock(e.target.value)}
        min="0"
        placeholder="Số lượng mới"
      />
      <button onClick={handleUpdate} disabled={updating}>
        {updating ? 'Đang cập nhật...' : 'Cập nhật tồn kho'}
      </button>
    </div>
  );
};

export default ProductInventoryCard;