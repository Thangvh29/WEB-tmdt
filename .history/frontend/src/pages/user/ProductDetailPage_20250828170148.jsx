// frontend/src/pages/user/ProductDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/axios';
import Reviews from '../../components/user/Reviews';
import '../../assets/style/product-detail.css'; // Giả sử CSS

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [attributes, setAttributes] = useState({});
  const [canBuy, setCanBuy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/user/products/${id}`);
      setProduct(data.product);
      setCanBuy(data.canBuy);
      // Set default variant nếu có
      if (data.variants?.length > 0) {
        const defaultVar = data.variants.find(v => v.isDefault);
        setSelectedVariant(defaultVar || data.variants[0]);
      }
    } catch (err) {
      setError('Không tìm thấy sản phẩm');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAttributeChange = async (name, value) => {
    const newAttrs = { ...attributes, [name]: value };
    setAttributes(newAttrs);

    // Check variant
    try {
      const { data } = await api.post(`/user/products/${id}/check-variant`, {
        attributes: newAttrs,
      });
      if (data.found) {
        setSelectedVariant(data.variant);
      } else {
        setSelectedVariant(null);
      }
    } catch (err) {
      console.error('Error checking variant:', err);
    }
  };

  const handleAddToCart = async () => {
    if (!canBuy || !selectedVariant?.stock) return;
    try {
      // Giả định endpoint /api/user/cart/add
      await api.post('/user/cart/add', {
        productId: id,
        variantId: selectedVariant?._id,
        quantity: 1,
      });
      alert('Đã thêm vào giỏ hàng');
    } catch (err) {
      console.error(err);
    }
  };

  const handleBuyNow = () => {
    if (!canBuy || !selectedVariant?.stock) return;
    // Redirect to checkout or payment
    navigate('/user/payment', { state: { productId: id, variantId: selectedVariant?._id } });
  };

  if (loading) return <p>Đang tải...</p>;
  if (error) return <p>{error}</p>;
  if (!product) return null;

  const inStock = (selectedVariant?.stock || product.stock) > 0;

  return (
    <div className="product-detail-page">
      <h1>{product.name}</h1>
      <img src={product.images[0]} alt={product.name} />
      <p>{product.description}</p>
      <p>Giá: {selectedVariant?.price || product.price} VND</p>
      <p>Trạng thái: {inStock ? 'Còn hàng' : 'Hết hàng'}</p>

      {/* Variant selection */}
      {product.variants?.length > 0 && (
        <div className="variants">
          {[...new Set(product.variants.flatMap(v => v.attributes.map(a => a.name)))].map(name => (
            <div key={name}>
              <label>{name}:</label>
              <select onChange={(e) => handleAttributeChange(name, e.target.value)}>
                <option>Chọn</option>
                {[...new Set(product.variants.flatMap(v => v.attributes.filter(a => a.name === name).map(a => a.value)))].map(value => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="actions" style={{ position: 'fixed', bottom: 0 }}>
        {inStock && canBuy ? (
          <>
            <button onClick={handleBuyNow}>Mua ngay / Trả góp</button>
            <button onClick={handleAddToCart}>Thêm vào giỏ hàng</button>
          </>
        ) : (
          <p>Hết hàng</p>
        )}
      </div>

      {/* Reviews */}
      <Reviews productId={id} />
    </div>
  );
};

export default ProductDetailPage;