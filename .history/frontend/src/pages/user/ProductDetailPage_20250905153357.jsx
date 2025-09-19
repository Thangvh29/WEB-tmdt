// src/pages/user/ProductDetailPage.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/axios";
import Payment from "../../components/user/Payment"; // import Payment component

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);
      } catch (err) {
        console.error("Lỗi tải sản phẩm:", err);
      }
    };
    fetchProduct();
  }, [id]);

  const handleBuyNow = () => {
    console.log(">>> Mua ngay clicked"); // kiểm tra có log không
    setShowPayment(true);
  };

  if (!product) return <p>Đang tải sản phẩm...</p>;

  return (
    <div className="product-detail-page">
      <h2>{product.name}</h2>
      <p>Giá: {product.price}đ</p>

      {/* Nút hành động */}
      <div className="actions">
        <button className="btn btn-danger" onClick={handleBuyNow}>
          Mua ngay
        </button>
        <button className="btn btn-warning" onClick={handleBuyNow}>
          Trả góp
        </button>
      </div>

      {/* Modal thanh toán */}
      {showPayment && (
        <div className="payment-overlay">
          <div className="payment-modal">
            <Payment
              product={product}
              variant={selectedVariant}
              quantity={quantity}
              onClose={() => setShowPayment(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
