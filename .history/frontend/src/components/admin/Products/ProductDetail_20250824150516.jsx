// src/components/admin/products/ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import api from '../../../services/axios';

const ProductDetail = ({ productId, onClose, onEdit }) => {
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/admin/products/${productId}`);
      setProduct(data);
    } catch (err) {
      console.error('Lỗi tải sản phẩm');
    }
  };

  const fetchReviews = async () => {
    try {
      const { data } = await api.get(`/admin/reviews?productId=${productId}`);
      setReviews(data.reviews);
    } catch (err) {
      console.error('Lỗi tải đánh giá');
    }
  };

  const handleApproveReview = async (reviewId) => {
    try {
      await api.patch(`/admin/reviews/${reviewId}`, { approved: true });
      fetchReviews();
    } catch (err) {
      console.error('Lỗi duyệt');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await api.delete(`/admin/reviews/${reviewId}`);
      fetchReviews();
    } catch (err) {
      console.error('Lỗi xóa');
    }
  };

  const handleReplyReview = async (reviewId, reply) => {
    try {
      await api.post(`/admin/reviews/${reviewId}/reply`, { reply });
      fetchReviews();
    } catch (err) {
      console.error('Lỗi trả lời');
    }
  };

  if (!product) return <div>Loading...</div>;

  return (
    <div className="product-detail">
      <h2>{product.name}</h2>
      <button onClick={onEdit}>Chỉnh sửa</button>
      {/* Hiển thị giống cellphones: images, specs, commitments, description, variants */}
      <div>
        {product.images.map((img, i) => <img key={i} src={img} alt="" />)}
      </div>
      <div>
        <h3>Thông số</h3>
        {product.specs.map((spec, i) => <p key={i}>{spec.key}: {spec.value}</p>)}
      </div>
      <div>
        <h3>Cam kết</h3>
        {product.commitments.map((commit, i) => <p key={i}>{commit}</p>)}
      </div>
      <p>{product.description}</p>
      <div>
        <h3>Đánh giá</h3>
        {reviews.map((review) => (
          <div key={review._id}>
            <p>{review.content}</p>
            <button onClick={() => handleApproveReview(review._id)}>Duyệt</button>
            <button onClick={() => handleDeleteReview(review._id)}>Xóa</button>
            <input placeholder="Trả lời" onKeyDown={(e) => e.key === 'Enter' && handleReplyReview(review._id, e.target.value)} />
          </div>
        ))}
      </div>
      <button onClick={onClose}>Đóng</button>
    </div>
  );
};

export default ProductDetail;