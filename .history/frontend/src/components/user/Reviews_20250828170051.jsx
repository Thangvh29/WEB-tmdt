// frontend/src/components/user/Reviews.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/axios';

const Reviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ content: '', rating: 0 });
  const [replyTo, setReplyTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const { data } = await api.get(`/user/products/${productId}/reviews`);
      setReviews(data.reviews);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitReview = async () => {
    try {
      // Giả định endpoint POST /api/user/products/:id/reviews (cần thêm ở backend)
      await api.post(`/user/products/${productId}/reviews`, newReview);
      fetchReviews();
      setNewReview({ content: '', rating: 0 });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitReply = async (parentId) => {
    try {
      // Giả định endpoint POST /api/user/products/:id/reviews/:parentId/reply
      await api.post(`/user/products/${productId}/reviews/${parentId}/reply`, { content: replyContent });
      fetchReviews();
      setReplyContent('');
      setReplyTo(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="reviews">
      <h2>Đánh giá</h2>
      {reviews.map(review => (
        <div key={review._id}>
          <p>{review.author.name}: {review.content} ({review.rating} sao)</p>
          <button onClick={() => setReplyTo(review._id)}>Trả lời</button>
          {replyTo === review._id && (
            <>
              <textarea value={replyContent} onChange={e => setReplyContent(e.target.value)} />
              <button onClick={() => handleSubmitReply(review._id)}>Gửi</button>
            </>
          )}
          {/* Hiển thị replies nếu có */}
        </div>
      ))}
      <div>
        <select value={newReview.rating} onChange={e => setNewReview({ ...newReview, rating: Number(e.target.value) })}>
          <option>Chọn sao</option>
          {[1,2,3,4,5].map(s => <option key={s} value={s}>{s} sao</option>)}
        </select>
        <textarea value={newReview.content} onChange={e => setNewReview({ ...newReview, content: e.target.value })} />
        <button onClick={handleSubmitReview}>Gửi đánh giá</button>
      </div>
    </div>
  );
};

export default Reviews;