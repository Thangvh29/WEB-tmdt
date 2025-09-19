// frontend/src/components/auth/Reviews.jsx
import React, { useEffect, useState } from "react";
import api from "../../services/axios";
import "../../assets/style/reviews.css";

const Reviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data } = await api.get(`/products/${productId}/reviews`);
        setReviews(data.reviews || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchReviews();
  }, [productId]);

  return (
    <div className="reviews">
      <h2>Đánh giá sản phẩm</h2>
      <div className="review-list">
        {reviews.length === 0 && <p>Chưa có đánh giá nào</p>}
        {reviews.map((r) => (
          <div key={r._id} className="review-item">
            <div className="review-header">
              <strong>{r.author?.name || "Người dùng"}</strong>
              <span className="stars">
                {"★".repeat(r.rating || 0)}
                {"☆".repeat(5 - (r.rating || 0))}
              </span>
            </div>
            <p>{r.content}</p>
            {r.replies && r.replies.map((rep) => (
              <div key={rep._id} className="reply-item">
                <strong>{rep.author?.name || "Người dùng"}</strong>
                <p>{rep.content}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reviews;
